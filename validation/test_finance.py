"""Unit tests for the shared financial primitives."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from finance import (  # noqa: E402
    annual_cost_flows,
    compound,
    exponential_value,
    level_monthly_cost,
    loan_balance,
    loan_payment,
    monthly_rate,
    npv,
)


class MonthlyRateTest(unittest.TestCase):
    def test_geometric_conversion_compounds_back_to_annual(self):
        rate = monthly_rate(0.015)
        self.assertAlmostEqual((1 + rate) ** 12 - 1, 0.015, places=12)

    def test_zero_rate(self):
        self.assertEqual(monthly_rate(0.0), 0.0)


class NpvTest(unittest.TestCase):
    def test_zero_rate_is_a_plain_sum(self):
        self.assertAlmostEqual(npv([(0, 100.0), (12, 100.0)], 0.0), 200.0)

    def test_later_costs_are_discounted(self):
        rate = monthly_rate(0.05)
        self.assertLess(npv([(12, 100.0)], rate), 100.0)


class LevelMonthlyCostTest(unittest.TestCase):
    def test_zero_rate_spreads_evenly(self):
        self.assertAlmostEqual(level_monthly_cost(1200.0, 0.0, 12), 100.0)

    def test_rejects_non_positive_horizon(self):
        with self.assertRaises(ValueError):
            level_monthly_cost(1000.0, 0.001, 0)


class LoanTest(unittest.TestCase):
    def test_zero_apr_is_straight_line(self):
        self.assertAlmostEqual(loan_payment(1200.0, 0.0, 12), 100.0)

    def test_balance_is_zero_at_and_after_term(self):
        self.assertEqual(loan_balance(33600.0, 0.0399, 60, 60), 0.0)
        self.assertEqual(loan_balance(33600.0, 0.0399, 60, 72), 0.0)

    def test_balance_declines_over_time(self):
        earlier = loan_balance(33600.0, 0.0399, 60, 12)
        later = loan_balance(33600.0, 0.0399, 60, 24)
        self.assertLess(later, earlier)

    def test_payments_amortize_principal_and_interest(self):
        payment = loan_payment(33600.0, 0.0399, 60)
        self.assertGreater(payment * 60, 33600.0)


class ExponentialValueTest(unittest.TestCase):
    def test_passes_through_both_anchors(self):
        self.assertAlmostEqual(exponential_value(46630.0, 36, 29369.40, 0), 46630.0, places=6)
        self.assertAlmostEqual(exponential_value(46630.0, 36, 29369.40, 36), 29369.40, places=6)

    def test_extrapolates_below_the_anchor(self):
        self.assertLess(exponential_value(46630.0, 36, 29369.40, 48), 29369.40)

    def test_never_returns_negative_value(self):
        self.assertGreater(exponential_value(46630.0, 36, 29369.40, 240), 0.0)


class AnnualCostFlowsTest(unittest.TestCase):
    def test_posts_at_each_completed_year_end(self):
        self.assertEqual(annual_cost_flows(100.0, 36), [(12, 100.0), (24, 100.0), (36, 100.0)])

    def test_partial_year_is_not_charged(self):
        self.assertEqual(annual_cost_flows(100.0, 30), [(12, 100.0), (24, 100.0)])


class CompoundTest(unittest.TestCase):
    def test_yearly_compounding(self):
        self.assertAlmostEqual(compound(33600.0, 0.10, 24), 33600.0 * 1.21, places=6)


if __name__ == "__main__":
    unittest.main()
