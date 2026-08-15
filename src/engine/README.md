# Calculation engine

The JavaScript implementation of the vehicle economics model. It runs unchanged
in Node and in the browser: plain ESM with JSDoc types, no build step, no
dependencies.

## Rules

1. **This is the only place financial formulas live.** The UI in
   [`web/`](../../web) imports these modules and formats their output. It must
   never recompute, adjust, or "correct" a figure locally.
2. **It must agree with the Python harness.** [`validation/`](../../validation)
   is the independent reference implementation. Both suites assert the same
   documented figures from [`docs/multi-flow-ux.md`](../../docs/multi-flow-ux.md).
   A change to a formula here requires the same change there.
3. **Documented figures are locked by tests.** If a number in the docs changes,
   the test changes with it in the same commit, with the reason stated.

## Run the tests

```bash
npm test                # this engine
npm run test:python     # the reference harness
```

## Layout

| File | Purpose |
| --- | --- |
| `finance.js` | Discounting, annuity, loan, depreciation, and compounding primitives |
| `new-car.js` | Flow 2A cash, loan, and lease path model |
| `fixtures.js` | The documented Flow 2A scenario, with overridable inputs |
| `finance.test.js` | Unit tests for the primitives |
| `new-car.test.js` | Regression tests locking the documented Flow 2A snapshot |

## Interpreting results

Each path result reports two cost measures and two disclosure balances.

- `monthlyOwnershipCost` - vehicle-only equivalent monthly cost.
- `investmentAdjustedMonthlyCost` - also charges the path for the return its
  own time-zero outlay gave up. This charge is a property of the path, not of
  the user's wealth, so it does not change when available capital changes.
- `vehicleEquity` and `investmentBalance` are **per-path disclosures, not a
  ranking**. The overlay funds only the time-zero outlay, so a path that defers
  a large payment shows an inflated balance while that payment is charged in
  cost NPV instead. Compare paths by cost, never by terminal position.

`comparable: false` means the path cannot be evaluated at that horizon (for
example a lease held past its term with no buyout quote). Surface `reason` to
the user rather than silently dropping the path.
