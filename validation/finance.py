"""Deterministic financial primitives for Cardec model validation.

Conventions locked by docs/multi-flow-ux.md:

- Discount rates are effective annual rates converted geometrically to monthly.
- Loan APRs are nominal annual rates divided by 12, matching lender practice.
- Month zero is the transaction date; recurring payments land at period end.
"""

from typing import Iterable, Sequence, Tuple

CashFlow = Tuple[int, float]


def monthly_rate(annual_rate: float) -> float:
    """Convert an effective annual rate to its geometric monthly equivalent."""
    return (1.0 + annual_rate) ** (1.0 / 12.0) - 1.0


def discount_factor(rate_per_month: float, month: int) -> float:
    if month < 0:
        raise ValueError("month must not be negative")
    return (1.0 + rate_per_month) ** (-month)


def npv(flows: Iterable[CashFlow], rate_per_month: float) -> float:
    """Present value of (month, amount) pairs, where positive amounts are costs."""
    return sum(amount * discount_factor(rate_per_month, month) for month, amount in flows)


def level_monthly_cost(cost_npv: float, rate_per_month: float, months: int) -> float:
    """Equivalent level monthly cost of a present value over a holding period."""
    if months <= 0:
        raise ValueError("months must be positive")
    if rate_per_month == 0:
        return cost_npv / months
    return cost_npv * rate_per_month / (1.0 - (1.0 + rate_per_month) ** (-months))


def loan_payment(principal: float, apr: float, term_months: int) -> float:
    if term_months <= 0:
        raise ValueError("term_months must be positive")
    rate = apr / 12.0
    if rate == 0:
        return principal / term_months
    return principal * rate / (1.0 - (1.0 + rate) ** (-term_months))


def loan_balance(principal: float, apr: float, term_months: int, elapsed_months: int) -> float:
    """Remaining balance after `elapsed_months` scheduled payments."""
    if elapsed_months < 0:
        raise ValueError("elapsed_months must not be negative")
    if elapsed_months >= term_months:
        return 0.0
    rate = apr / 12.0
    payment = loan_payment(principal, apr, term_months)
    if rate == 0:
        return principal - payment * elapsed_months
    growth = (1.0 + rate) ** elapsed_months
    return principal * growth - payment * (growth - 1.0) / rate


def exponential_value(initial_value: float, anchor_month: int, anchor_value: float, month: int) -> float:
    """Exponential depreciation curve through (0, initial) and (anchor_month, anchor).

    Used for both interpolation and extrapolation, matching the documented
    resale proxy. The curve never returns a negative value.
    """
    if anchor_month <= 0:
        raise ValueError("anchor_month must be positive")
    if initial_value <= 0 or anchor_value <= 0:
        raise ValueError("values must be positive to fit an exponential curve")
    ratio = anchor_value / initial_value
    return initial_value * (ratio ** (month / anchor_month))


def annual_cost_flows(annual_amount: float, horizon_months: int) -> Sequence[CashFlow]:
    """Recurring annual costs posted at the end of each completed year."""
    return [(month, annual_amount) for month in range(12, horizon_months + 1, 12)]


def compound(principal: float, annual_return: float, months: int) -> float:
    """Gross balance with yearly compounding, as used by the initial-capital overlay."""
    return principal * (1.0 + annual_return) ** (months / 12.0)
