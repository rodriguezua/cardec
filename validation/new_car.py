"""Flow 2A (new car acquisition) reference model.

This is a validation harness for the calculation rules in docs/multi-flow-ux.md,
not the production application. It exists to make the documented numbers
reproducible and to catch regressions when the model changes.
"""

from dataclasses import dataclass, field
from typing import List, Optional

from finance import (
    CashFlow,
    annual_cost_flows,
    compound,
    discount_factor,
    exponential_value,
    level_monthly_cost,
    loan_balance,
    loan_payment,
    monthly_rate,
    npv,
)

RETURN = "return"
BUYOUT = "buyout"


@dataclass(frozen=True)
class Vehicle:
    msrp: float
    resale_anchor_month: int
    resale_anchor_value: float

    def market_value(self, month: int) -> float:
        return exponential_value(
            self.msrp, self.resale_anchor_month, self.resale_anchor_value, month
        )


@dataclass(frozen=True)
class Ownership:
    annual_government_charges: float = 0.0
    annual_energy: float = 0.0

    @property
    def annual_total(self) -> float:
        return self.annual_government_charges + self.annual_energy


@dataclass(frozen=True)
class LoanTerms:
    down_payment: float
    apr: float
    term_months: int


@dataclass(frozen=True)
class LeaseTerms:
    due_at_signing: float
    monthly_payment: float
    term_months: int
    disposition_fee: float
    buyout_price: float
    buyout_fees: float = 0.0
    first_payment_in_due_at_signing: bool = True


@dataclass(frozen=True)
class Capital:
    available: float
    gross_annual_return: float


@dataclass(frozen=True)
class Scenario:
    vehicle: Vehicle
    out_the_door: float
    ownership: Ownership
    capital: Capital
    discount_rate_annual: float
    loan: Optional[LoanTerms] = None
    lease: Optional[LeaseTerms] = None


@dataclass
class PathResult:
    path: str
    horizon_months: int
    comparable: bool = True
    reason: Optional[str] = None
    affordable: bool = True
    time_zero_outlay: float = 0.0
    cost_npv: float = 0.0
    monthly_ownership_cost: float = 0.0
    vehicle_equity: float = 0.0
    invested_principal: float = 0.0
    investment_balance: float = 0.0
    investment_adjusted_npv: float = 0.0
    investment_adjusted_monthly_cost: float = 0.0
    flows: List[CashFlow] = field(default_factory=list)


def _not_comparable(path: str, horizon_months: int, reason: str) -> PathResult:
    return PathResult(path=path, horizon_months=horizon_months, comparable=False, reason=reason)


def _finalize(
    result: PathResult,
    scenario: Scenario,
    flows: List[CashFlow],
    time_zero_outlay: float,
    vehicle_equity: float,
) -> PathResult:
    rate = monthly_rate(scenario.discount_rate_annual)
    horizon = result.horizon_months

    result.flows = flows
    result.time_zero_outlay = time_zero_outlay
    result.cost_npv = npv(flows, rate)
    result.monthly_ownership_cost = level_monthly_cost(result.cost_npv, rate, horizon)
    result.vehicle_equity = vehicle_equity

    # The overlay invests only capital left unused at time zero. Recurring
    # payments are handled as cash flows in cost NPV, never withdrawn here.
    result.invested_principal = max(scenario.capital.available - time_zero_outlay, 0.0)
    result.investment_balance = compound(
        result.invested_principal, scenario.capital.gross_annual_return, horizon
    )

    foregone_gain = time_zero_outlay * (
        (1.0 + scenario.capital.gross_annual_return) ** (horizon / 12.0) - 1.0
    )
    result.investment_adjusted_npv = result.cost_npv + foregone_gain * discount_factor(rate, horizon)
    result.investment_adjusted_monthly_cost = level_monthly_cost(
        result.investment_adjusted_npv, rate, horizon
    )
    result.affordable = scenario.capital.available + 1e-9 >= time_zero_outlay
    return result


def cash_path(scenario: Scenario, horizon_months: int) -> PathResult:
    result = PathResult(path="cash", horizon_months=horizon_months)
    resale = scenario.vehicle.market_value(horizon_months)

    flows: List[CashFlow] = [(0, scenario.out_the_door)]
    flows.extend(annual_cost_flows(scenario.ownership.annual_total, horizon_months))
    flows.append((horizon_months, -resale))

    return _finalize(result, scenario, flows, scenario.out_the_door, resale)


def loan_path(scenario: Scenario, horizon_months: int) -> PathResult:
    if scenario.loan is None:
        return _not_comparable("loan", horizon_months, "no loan terms supplied")

    loan = scenario.loan
    result = PathResult(path="loan", horizon_months=horizon_months)
    principal = scenario.out_the_door - loan.down_payment
    if principal < 0:
        return _not_comparable("loan", horizon_months, "down payment exceeds out-the-door price")

    payment = loan_payment(principal, loan.apr, loan.term_months)
    paid_months = min(horizon_months, loan.term_months)
    balance = loan_balance(principal, loan.apr, loan.term_months, paid_months)
    resale = scenario.vehicle.market_value(horizon_months)

    flows: List[CashFlow] = [(0, loan.down_payment)]
    flows.extend((month, payment) for month in range(1, paid_months + 1))
    flows.extend(annual_cost_flows(scenario.ownership.annual_total, horizon_months))
    flows.append((horizon_months, -(resale - balance)))

    return _finalize(result, scenario, flows, loan.down_payment, resale - balance)


def lease_path(scenario: Scenario, horizon_months: int, lease_end: str = RETURN) -> PathResult:
    if scenario.lease is None:
        return _not_comparable("lease", horizon_months, "no lease terms supplied")

    lease = scenario.lease
    label = "lease" if horizon_months <= lease.term_months else "lease-then-buyout"

    if horizon_months < lease.term_months:
        return _not_comparable(
            label,
            horizon_months,
            "holding period ends before lease maturity and no early-termination "
            "or buyout quote was supplied",
        )
    if horizon_months > lease.term_months and lease_end != BUYOUT:
        return _not_comparable(
            label,
            horizon_months,
            "holding period exceeds the lease term, which requires a buyout or "
            "replacement-lease path",
        )

    result = PathResult(path=label if lease_end == RETURN else label + "-buyout",
                        horizon_months=horizon_months)

    scheduled = lease.term_months - 1 if lease.first_payment_in_due_at_signing else lease.term_months
    flows: List[CashFlow] = [(0, lease.due_at_signing)]
    flows.extend((month, lease.monthly_payment) for month in range(1, scheduled + 1))
    flows.extend(annual_cost_flows(scenario.ownership.annual_total, horizon_months))

    if lease_end == RETURN:
        flows.append((lease.term_months, lease.disposition_fee))
        vehicle_equity = 0.0
    else:
        flows.append((lease.term_months, lease.buyout_price + lease.buyout_fees))
        vehicle_equity = scenario.vehicle.market_value(horizon_months)
        flows.append((horizon_months, -vehicle_equity))

    return _finalize(result, scenario, flows, lease.due_at_signing, vehicle_equity)
