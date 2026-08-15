/**
 * Regression tests locking the documented Flow 2A snapshot.
 *
 * These expectations are identical to validation/test_flow_2a.py. The two
 * implementations act as cross-checks: if the JavaScript engine and the Python
 * harness ever disagree, one of them has drifted.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loanPayment } from './finance.js';
import {
  FLOW_2A_INCENTIVE,
  FLOW_2A_MSRP,
  FLOW_2A_OUT_THE_DOOR,
  flow2aScenario,
} from './fixtures.js';
import { BUYOUT, RETURN, cashPath, leasePath, loanPath, marketValue } from './new-car.js';

const scenario = flow2aScenario();

describe('Flow 2A fixture', () => {
  it('treats the incentive as a price cut, not a change in market value', () => {
    assert.equal(
      Math.round((FLOW_2A_MSRP - FLOW_2A_INCENTIVE + 500 + 2370) * 100) / 100,
      FLOW_2A_OUT_THE_DOOR,
    );
    assert.equal(marketValue(scenario.vehicle, 0), FLOW_2A_MSRP);
  });

  it('reproduces the documented loan payment', () => {
    assert.equal(Math.round(loanPayment(33600, 0.0399, 60) * 100) / 100, 618.64);
  });

  it('reproduces the documented resale curve', () => {
    assert.equal(Math.round(marketValue(scenario.vehicle, 24)), 34262);
    assert.equal(Math.round(marketValue(scenario.vehicle, 36)), 29369);
    assert.equal(Math.round(marketValue(scenario.vehicle, 48)), 25175);
  });
});

describe('vehicle-only equivalent monthly ownership cost', () => {
  it('matches for cash', () => {
    for (const [horizon, expected] of [[24, 506], [36, 531], [48, 529]]) {
      assert.equal(Math.round(cashPath(scenario, horizon).monthlyOwnershipCost), expected);
    }
  });

  it('matches for loan', () => {
    for (const [horizon, expected] of [[24, 564], [36, 582], [48, 573]]) {
      assert.equal(Math.round(loanPath(scenario, horizon).monthlyOwnershipCost), expected);
    }
  });

  it('matches for lease', () => {
    assert.equal(Math.round(leasePath(scenario, 36, RETURN).monthlyOwnershipCost), 622);
    assert.equal(Math.round(leasePath(scenario, 36, BUYOUT).monthlyOwnershipCost), 625);
    assert.equal(Math.round(leasePath(scenario, 48, BUYOUT).monthlyOwnershipCost), 599);
  });

  // The 36-month row originally read $532 and $583. docs/multi-flow-ux.md
  // explains that correction using these exact unrounded values, so they are
  // asserted at cent precision: rounding alone would let the cited figures drift.
  it('locks the corrected 36-month cells to the cent', () => {
    assert.ok(Math.abs(cashPath(scenario, 36).monthlyOwnershipCost - 531.45) < 0.005);
    assert.ok(Math.abs(loanPath(scenario, 36).monthlyOwnershipCost - 582.41) < 0.005);
  });
});

describe('investment-adjusted monthly ownership cost', () => {
  it('matches for cash and loan', () => {
    const expected = { 24: [868, 636], 36: [909, 658], 48: [923, 652] };
    for (const [horizon, [cash, loan]] of Object.entries(expected)) {
      const months = Number(horizon);
      assert.equal(
        Math.round(cashPath(scenario, months).investmentAdjustedMonthlyCost),
        cash,
      );
      assert.equal(
        Math.round(loanPath(scenario, months).investmentAdjustedMonthlyCost),
        loan,
      );
    }
  });

  it('matches for lease', () => {
    assert.equal(
      Math.round(leasePath(scenario, 36, RETURN).investmentAdjustedMonthlyCost),
      659,
    );
    assert.equal(
      Math.round(leasePath(scenario, 36, BUYOUT).investmentAdjustedMonthlyCost),
      662,
    );
    assert.equal(
      Math.round(leasePath(scenario, 48, BUYOUT).investmentAdjustedMonthlyCost),
      638,
    );
  });
});

describe('equity and investment balances', () => {
  it('matches documented investment balances', () => {
    for (const horizon of [24, 36, 48]) {
      assert.equal(Math.round(cashPath(scenario, horizon).investmentBalance), 0);
    }
    const expectedLoan = { 24: 40656, 36: 44722, 48: 49194 };
    for (const [horizon, expected] of Object.entries(expectedLoan)) {
      assert.equal(
        Math.round(loanPath(scenario, Number(horizon)).investmentBalance),
        expected,
      );
    }
    assert.equal(Math.round(leasePath(scenario, 36, RETURN).investmentBalance), 50421);
    assert.equal(Math.round(leasePath(scenario, 48, BUYOUT).investmentBalance), 55463);
  });

  it('matches documented vehicle equity', () => {
    const expectedCash = { 24: 34262, 36: 29369, 48: 25175 };
    const expectedLoan = { 24: 13305, 36: 15122, 48: 17909 };
    for (const horizon of [24, 36, 48]) {
      assert.equal(Math.round(cashPath(scenario, horizon).vehicleEquity), expectedCash[horizon]);
      assert.equal(Math.round(loanPath(scenario, horizon).vehicleEquity), expectedLoan[horizon]);
    }
    assert.equal(leasePath(scenario, 36, RETURN).vehicleEquity, 0);
    assert.equal(Math.round(leasePath(scenario, 48, BUYOUT).vehicleEquity), 25175);
  });
});

describe('lease comparability rules', () => {
  it('rejects a horizon before lease maturity', () => {
    const result = leasePath(scenario, 24, RETURN);
    assert.equal(result.comparable, false);
    assert.match(result.reason, /before lease maturity/);
  });

  it('requires a buyout past the lease term', () => {
    const result = leasePath(scenario, 48, RETURN);
    assert.equal(result.comparable, false);
    assert.match(result.reason, /exceeds the lease term/);
  });
});

describe('limited capital', () => {
  it('marks cash unaffordable below the out-the-door price', () => {
    const limited = flow2aScenario({ availableCapital: 15000 });
    assert.equal(cashPath(limited, 36).affordable, false);
    assert.equal(loanPath(limited, 36).affordable, true);
  });

  it('reproduces the documented all-cash-down loan case', () => {
    const limited = flow2aScenario({ availableCapital: 4118.15, downPayment: 4118.15 });
    const result = loanPath(limited, 36);
    assert.equal(Math.round(result.monthlyOwnershipCost), 589);
    assert.equal(Math.round(result.investmentAdjustedMonthlyCost), 626);
  });

  it('leaves the opportunity-cost ranking unchanged as capital grows', () => {
    const low = loanPath(flow2aScenario({ availableCapital: 8400 }), 36);
    const high = loanPath(flow2aScenario({ availableCapital: 42000 }), 36);
    assert.equal(
      Math.round(low.investmentAdjustedMonthlyCost),
      Math.round(high.investmentAdjustedMonthlyCost),
    );
  });
});
