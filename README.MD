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
harness and by a calculation engine with an exploratory UI; used-vehicle,
multi-vehicle, and stochastic work is not started.

## Model validation harness

The model is implemented twice on purpose, and the two implementations are
cross-checked against the same documented figures. A disagreement between them
means one has drifted.

[`validation/`](validation/README.md) holds the dependency-free Python
reference harness:

```bash
python3 -m unittest discover -s validation -p 'test_*.py'
```

[`src/engine/`](src/engine) holds the JavaScript port that the UI runs on. It
is plain ESM with JSDoc types, so it needs no build step and no dependencies:

```bash
npm test
```

## Exploratory UI

[`web/`](web) is a slider-driven surface for the Flow 2A paths. It exists to
make the model inspectable, not to propose a final product design (see
"Current phase" above).

```bash
npm start   # http://localhost:5173/web/
```

The UI imports `src/engine/` directly and holds **no financial formulas of its
own**. Every displayed figure comes from the tested engine. If a number looks
wrong, fix the engine and its tests; never adjust the presentation layer to
compensate.

## Concept and model documentation

- [Multi-flow product concept and provisional UI requirements](docs/multi-flow-ux.md)
- [Flowcharts and questionnaire logic](docs/flow-diagrams.md)
- [Canonical calculator input schema](schemas/calculator-input.schema.json)
- [Model validation harness](validation/README.md)
- [Calculation engine](src/engine)

The working input contract uses a shared scenario envelope and three
discriminated flows:

- `replacement-timing`
- `new-car-acquisition`
- `used-vs-new`
