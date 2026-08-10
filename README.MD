# Cardec

Cardec is a multi-flow vehicle economics calculator for replacement timing,
financing decisions, and new-versus-used comparisons.

## Product design

- [Multi-flow UX specification](docs/multi-flow-ux.md)
- [Canonical calculator input schema](schemas/calculator-input.schema.json)

The input contract uses a shared scenario envelope and three discriminated
flows:

- `replacement-timing`
- `new-car-acquisition`
- `used-vs-new`
