"""Limited initial capital study for Flow 2A.

Holds the validated Flow 2A vehicle, contract, and cost assumptions fixed and
varies only the capital the user actually has at time zero. Run:

    python3 validation/limited_capital.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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

OUT_THE_DOOR = 42000.00
BASELINE_DOWN = 8400.00
LEASE_DRIVE_OFF = 4118.15
HORIZON = 36

CAPITAL_LEVELS = [LEASE_DRIVE_OFF, BASELINE_DOWN, 15000.00, OUT_THE_DOOR]


def build_scenario(available_capital):
    # Down payment policy: use the documented 20% baseline when the user can
    # afford it, otherwise put every available dollar down.
    down_payment = min(available_capital, BASELINE_DOWN)
    return Scenario(
        vehicle=Vehicle(msrp=46630.00, resale_anchor_month=36, resale_anchor_value=29369.40),
        out_the_door=OUT_THE_DOOR,
        ownership=Ownership(annual_government_charges=1423.44, annual_energy=220.00),
        capital=Capital(available=available_capital, gross_annual_return=0.10),
        discount_rate_annual=0.015,
        loan=LoanTerms(down_payment=down_payment, apr=0.0399, term_months=60),
        lease=LeaseTerms(
            due_at_signing=LEASE_DRIVE_OFF,
            monthly_payment=368.15,
            term_months=36,
            disposition_fee=395.00,
            buyout_price=29369.40,
            buyout_fees=500.00,
        ),
    )


def rows():
    for capital in CAPITAL_LEVELS:
        scenario = build_scenario(capital)
        results = [
            cash_path(scenario, HORIZON),
            loan_path(scenario, HORIZON),
            lease_path(scenario, HORIZON, RETURN),
            lease_path(scenario, HORIZON, BUYOUT),
        ]
        for result in results:
            if not result.comparable:
                continue
            yield capital, result


def main():
    print("Flow 2A limited-capital study, %d-month horizon" % HORIZON)
    print()
    header = (
        "| Available capital | Path | Affordable | Monthly cost | "
        "Investment-adjusted | Investment balance | Vehicle equity | Terminal position |"
    )
    print(header)
    print("| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |")

    for capital, result in rows():
        if not result.affordable:
            print(
                "| $%s | %s | no | n/a | n/a | n/a | n/a | n/a |"
                % (format(round(capital), ","), result.path)
            )
            continue

        terminal = result.vehicle_equity + result.investment_balance
        print(
            "| $%s | %s | yes | $%d | $%d | $%s | $%s | $%s |"
            % (
                format(round(capital), ","),
                result.path,
                round(result.monthly_ownership_cost),
                round(result.investment_adjusted_monthly_cost),
                format(round(result.investment_balance), ","),
                format(round(result.vehicle_equity), ","),
                format(round(terminal), ","),
            )
        )


if __name__ == "__main__":
    main()
