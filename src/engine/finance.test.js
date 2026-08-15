/** Unit tests for the shared financial primitives. Mirrors validation/test_finance.py. */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  annualCostFlows,
  compound,
  exponentialValue,
  levelMonthlyCost,
  loanBalance,
  loanPayment,
  monthlyRate,
  npv,
} from './finance.js';

describe('monthlyRate', () => {
  it('compounds back to the annual rate', () => {
    const rate = monthlyRate(0.015);
    assert.ok(Math.abs((1 + rate) ** 12 - 1 - 0.015) < 1e-12);
  });

  it('handles a zero rate', () => {
    assert.equal(monthlyRate(0), 0);
  });
});

describe('npv', () => {
  it('is a plain sum at a zero rate', () => {
    assert.equal(npv([{ month: 0, amount: 100 }, { month: 12, amount: 100 }], 0), 200);
  });

  it('discounts later costs', () => {
    assert.ok(npv([{ month: 12, amount: 100 }], monthlyRate(0.05)) < 100);
  });
});

describe('levelMonthlyCost', () => {
  it('spreads evenly at a zero rate', () => {
    assert.equal(levelMonthlyCost(1200, 0, 12), 100);
  });

  it('rejects a non-positive horizon', () => {
    assert.throws(() => levelMonthlyCost(1000, 0.001, 0), RangeError);
  });
});

describe('loan', () => {
  it('is straight line at zero APR', () => {
    assert.equal(loanPayment(1200, 0, 12), 100);
  });

  it('reaches a zero balance at and after term', () => {
    assert.equal(loanBalance(33600, 0.0399, 60, 60), 0);
    assert.equal(loanBalance(33600, 0.0399, 60, 72), 0);
  });

  it('declines over time', () => {
    assert.ok(loanBalance(33600, 0.0399, 60, 24) < loanBalance(33600, 0.0399, 60, 12));
  });

  it('repays more than principal when interest is charged', () => {
    assert.ok(loanPayment(33600, 0.0399, 60) * 60 > 33600);
  });
});

describe('exponentialValue', () => {
  it('passes through both anchors', () => {
    assert.ok(Math.abs(exponentialValue(46630, 36, 29369.4, 0) - 46630) < 1e-6);
    assert.ok(Math.abs(exponentialValue(46630, 36, 29369.4, 36) - 29369.4) < 1e-6);
  });

  it('extrapolates below the anchor', () => {
    assert.ok(exponentialValue(46630, 36, 29369.4, 48) < 29369.4);
  });

  it('never returns a negative value', () => {
    assert.ok(exponentialValue(46630, 36, 29369.4, 240) > 0);
  });
});

describe('annualCostFlows', () => {
  it('posts at each completed year end', () => {
    assert.deepEqual(annualCostFlows(100, 36), [
      { month: 12, amount: 100 },
      { month: 24, amount: 100 },
      { month: 36, amount: 100 },
    ]);
  });

  it('does not charge a partial year', () => {
    assert.deepEqual(annualCostFlows(100, 30), [
      { month: 12, amount: 100 },
      { month: 24, amount: 100 },
    ]);
  });
});

describe('compound', () => {
  it('compounds yearly', () => {
    assert.ok(Math.abs(compound(33600, 0.1, 24) - 33600 * 1.21) < 1e-6);
  });
});
