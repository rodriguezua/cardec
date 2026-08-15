# Model validation harness

Executable checks for the calculation rules described in
[`docs/multi-flow-ux.md`](../docs/multi-flow-ux.md). This is a validation
harness for the current model-validation phase, **not** the production
application and not a UI prototype.

It exists so the documented numbers are reproducible and so changes to the
model fail loudly instead of drifting.

The model is implemented twice: this Python harness is the reference oracle,
and [`src/engine/`](../src/engine) is the JavaScript port the UI runs on. Both
assert the same documented figures, so a disagreement between them means one
has drifted. When you change a formula here, change it there too and run both
suites.

## Requirements

Python 3.9 or newer. No third-party packages.

## Run the tests

```bash
python3 -m unittest discover -s validation -p 'test_*.py'
```

## Run the limited-capital study

```bash
python3 validation/limited_capital.py
```

## Run the JavaScript port

```bash
npm test
```

## Layout

| File | Purpose |
| --- | --- |
| `finance.py` | Discounting, annuity, loan, depreciation, and compounding primitives |
| `new_car.py` | Flow 2A cash, loan, and lease path model |
| `test_finance.py` | Unit tests for the primitives |
| `test_flow_2a.py` | Regression tests locking the documented Flow 2A snapshot |
| `limited_capital.py` | Varies available capital against the fixed Flow 2A fixture |

## Locked conventions

- Discount rates are effective annual, converted geometrically:
  `(1 + annual) ** (1/12) - 1`.
- Loan APRs are nominal annual divided by 12.
- Recurring ownership costs post at the end of each completed year.
- Resale and lease disposition occur at the end of the holding period.
- The capital overlay invests only capital unused at time zero and makes no
  monthly contributions; later payments are cost-NPV cash flows.

## Not yet modeled

Used-vehicle depreciation and repair risk, multi-vehicle horizons, saving
behavior variants, jurisdiction tax profiles, and stochastic outputs.
