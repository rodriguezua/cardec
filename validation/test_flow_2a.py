"""Regression tests for the documented Flow 2A validation snapshot.

Source of truth: docs/multi-flow-ux.md, section 4.2.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from finance import loan_payment  # noqa: E402
from new_car import (  # noqa: E402
    BUYOUT,
    RETURN,
    Capital,
    LeaseTerms,
    LoanTerms,
    Ownership,
    Scenario,
    Vehicle,
    cash_path,
    lease_path,
    loan_path,
)

MSRP = 46630.00
INCENTIVE = 7500.00
OUT_THE_DOOR = 42000.00


def build_scenario(available_capital=OUT_THE_DOOR, down_payment=8400.00):
    return Scenario(
        vehicle=Vehicle(msrp=MSRP, resale_anchor_month=36, resale_anchor_value=29369.40),
        out_the_door=OUT_THE_DOOR,
        ownership=Ownership(annual_government_charges=1423.44, annual_energy=220.00),
        capital=Capital(available=available_capital, gross_annual_return=0.10),
        discount_rate_annual=0.015,
        loan=LoanTerms(down_payment=down_payment, apr=0.0399, term_months=60),
        lease=LeaseTerms(
            due_at_signing=4118.15,
            monthly_payment=368.15,
            term_months=36,
            disposition_fee=395.00,
            buyout_price=29369.40,
            buyout_fees=500.00,
        ),
    )


class FixtureTest(unittest.TestCase):
    def test_incentive_reduces_transaction_price_not_market_value(self):
        scenario = build_scenario()
        self.assertEqual(round(MSRP - INCENTIVE + 500.00 + 2370.00, 2), OUT_THE_DOOR)
        # The vehicle is still worth MSRP at delivery; the incentive is a price cut.
        self.assertAlmostEqual(scenario.vehicle.market_value(0), MSRP, places=6)

    def test_documented_loan_payment(self):
        self.assertEqual(round(loan_payment(33600.00, 0.0399, 60), 2), 618.64)

    def test_documented_resale_curve(self):
        vehicle = build_scenario().vehicle
        self.assertEqual(round(vehicle.market_value(24)), 34262)
        self.assertEqual(round(vehicle.market_value(36)), 29369)
        self.assertEqual(round(vehicle.market_value(48)), 25175)


class VehicleOnlyMonthlyCostTest(unittest.TestCase):
    """Documented vehicle-only equivalent monthly ownership cost."""

    def setUp(self):
        self.scenario = build_scenario()

    def test_cash(self):
        expected = {24: 506, 36: 531, 48: 529}
        for horizon, value in expected.items():
            self.assertEqual(round(cash_path(self.scenario, horizon).monthly_ownership_cost), value)

    def test_loan(self):
        expected = {24: 564, 36: 582, 48: 573}
        for horizon, value in expected.items():
            self.assertEqual(round(loan_path(self.scenario, horizon).monthly_ownership_cost), value)

    def test_lease(self):
        self.assertEqual(round(lease_path(self.scenario, 36, RETURN).monthly_ownership_cost), 622)
        self.assertEqual(round(lease_path(self.scenario, 36, BUYOUT).monthly_ownership_cost), 625)
        self.assertEqual(round(lease_path(self.scenario, 48, BUYOUT).monthly_ownership_cost), 599)

    def test_corrected_36_month_cells_to_the_cent(self):
        """Lock the correction documented in docs/multi-flow-ux.md.

        The 36-month row originally read $532 and $583. The doc explains the
        correction using these exact unrounded values, so they are asserted at
        cent precision: rounding alone would let the cited figures drift.
        """
        self.assertAlmostEqual(
            cash_path(self.scenario, 36).monthly_ownership_cost, 531.45, places=2
        )
        self.assertAlmostEqual(
            loan_path(self.scenario, 36).monthly_ownership_cost, 582.41, places=2
        )


class InvestmentAdjustedTest(unittest.TestCase):
    """Documented investment-adjusted monthly ownership cost at a 10% gross return."""

    def setUp(self):
        self.scenario = build_scenario()

    def test_cash_and_loan(self):
        expected = {24: (868, 636), 36: (909, 658), 48: (923, 652)}
        for horizon, (cash_value, loan_value) in expected.items():
            self.assertEqual(
                round(cash_path(self.scenario, horizon).investment_adjusted_monthly_cost),
                cash_value,
            )
            self.assertEqual(
                round(loan_path(self.scenario, horizon).investment_adjusted_monthly_cost),
                loan_value,
            )

    def test_lease(self):
        self.assertEqual(
            round(lease_path(self.scenario, 36, RETURN).investment_adjusted_monthly_cost), 659
        )
        self.assertEqual(
            round(lease_path(self.scenario, 36, BUYOUT).investment_adjusted_monthly_cost), 662
        )
        self.assertEqual(
            round(lease_path(self.scenario, 48, BUYOUT).investment_adjusted_monthly_cost), 638
        )


class EquityAndInvestmentBalanceTest(unittest.TestCase):
    def setUp(self):
        self.scenario = build_scenario()

    def test_investment_balances(self):
        for horizon in (24, 36, 48):
            self.assertEqual(round(cash_path(self.scenario, horizon).investment_balance), 0)
        expected_loan = {24: 40656, 36: 44722, 48: 49194}
        for horizon, value in expected_loan.items():
            self.assertEqual(round(loan_path(self.scenario, horizon).investment_balance), value)
        self.assertEqual(round(lease_path(self.scenario, 36, RETURN).investment_balance), 50421)
        self.assertEqual(round(lease_path(self.scenario, 48, BUYOUT).investment_balance), 55463)

    def test_vehicle_equity(self):
        expected_cash = {24: 34262, 36: 29369, 48: 25175}
        expected_loan = {24: 13305, 36: 15122, 48: 17909}
        for horizon in (24, 36, 48):
            self.assertEqual(round(cash_path(self.scenario, horizon).vehicle_equity), expected_cash[horizon])
            self.assertEqual(round(loan_path(self.scenario, horizon).vehicle_equity), expected_loan[horizon])
        self.assertEqual(lease_path(self.scenario, 36, RETURN).vehicle_equity, 0.0)
        self.assertEqual(round(lease_path(self.scenario, 48, BUYOUT).vehicle_equity), 25175)


class LeaseComparabilityRuleTest(unittest.TestCase):
    """Documented cross-field validation: a lease needs an exit quote to compare."""

    def setUp(self):
        self.scenario = build_scenario()

    def test_horizon_before_maturity_is_not_comparable(self):
        result = lease_path(self.scenario, 24, RETURN)
        self.assertFalse(result.comparable)
        self.assertIn("before lease maturity", result.reason)

    def test_horizon_past_term_requires_buyout(self):
        result = lease_path(self.scenario, 48, RETURN)
        self.assertFalse(result.comparable)
        self.assertIn("exceeds the lease term", result.reason)


if __name__ == "__main__":
    unittest.main()
