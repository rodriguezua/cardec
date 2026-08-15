# Cardec

Cardec is intended to become a **web-based vehicle economics application with
a graphical user interface**. It will help users evaluate replacement timing,
new-car acquisition options, and used-versus-new comparisons.

## Current phase: model validation

The project is currently testing the calculation and statistical methods behind
the application. The immediate objective is to establish that the financial
logic, cash-flow timing, depreciation and maintenance models, reliability
adjustments, opportunity-cost treatment, and stochastic outputs are correct.

UI layouts, interaction patterns, visual styling, and control behavior are
**not yet final product decisions**. The current diagrams describe the
information and decision logic the future web UI must support. UI options will
be reviewed only after the model produces correct, explainable, and repeatable
results.

Development order:

1. Validate deterministic calculations against known scenarios.
2. Validate statistical assumptions, simulations, and sensitivity outputs.
3. Stabilize calculation inputs, outputs, and decision rules.
4. Review UI concepts, visualizations, and user-control options.
5. Implement and test the selected web interface.

Step 1 is in progress. The Flow 2A new-car scenario is covered by an executable
harness; used-vehicle, multi-vehicle, and stochastic work is not started.

## Model validation harness

[`validation/`](validation/README.md) holds a dependency-free Python harness
that reproduces the documented Flow 2A figures and fails when the model drifts.

```bash
python3 -m unittest discover -s validation -p 'test_*.py'
```

## Concept and model documentation

- [Multi-flow product concept and provisional UI requirements](docs/multi-flow-ux.md)
- [Flowcharts and questionnaire logic](docs/flow-diagrams.md)
- [Canonical calculator input schema](schemas/calculator-input.schema.json)
- [Model validation harness](validation/README.md)

The working input contract uses a shared scenario envelope and three
discriminated flows:

- `replacement-timing`
- `new-car-acquisition`
- `used-vs-new`
