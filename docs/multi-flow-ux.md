# Multi-flow UX and input design

## 1. Product decision

Use one scenario workspace with three goal-based entry points. Do not present
users with one large vehicle form. Each flow asks only for inputs that can
change its result, while retaining shared assumptions when the user switches
or compares flows.

| Entry point | User decision | Primary result |
| --- | --- | --- |
| Replace my current car | "Keep it or replace it, and when?" | Optimal replacement age |
| Buy a new car | "Cash, loan, or lease?" | Monthly ownership cost by path |
| Compare used with new | "Is this used car actually cheaper?" | Monthly ownership cost: used vs new |

## 2. Navigation model

Detailed end-to-end flowcharts and conditional question paths for all three
stories are defined in [Flowcharts and questionnaire logic](flow-diagrams.md).

```mermaid
flowchart LR
  A[Choose decision] --> B[Scenario basics]
  B --> C{Flow}
  C -->|Replacement| D[Current vehicle]
  C -->|New car| E[New vehicle and offers]
  C -->|Used vs new| F[Used vehicle and new benchmark]
  D --> G[Cost and risk assumptions]
  E --> H[Cash loan lease options]
  F --> I[Ownership and reliability]
  G --> J[Review]
  H --> J
  I --> J
  J --> K[Results workspace]
  K --> L[Change assumptions]
  K --> M[Save scenario]
  K --> N[Open related flow]
```

The persistent workspace header contains scenario name, currency, save status,
and a `Change decision` action. The stepper contains only the active flow's
steps. Back navigation never discards entered values.

## 3. Shared scenario envelope

Every calculation is stored as a versioned scenario:

| Field | Required | UX control | Decision rule |
| --- | --- | --- | --- |
| Scenario name | Yes | Text | Default from vehicle and goal |
| Analysis date | Yes | Date | Defaults to today; anchors vehicle age and cash flows |
| Currency | Yes | Select | One currency per scenario; no implicit FX conversion |
| Annual distance | Yes | Number + mi/km | Must be positive |
| Analysis horizon | Yes | Year slider + input | 1–30 years |
| Discount rate | Yes | Percentage | Real or nominal, declared explicitly |
| Inflation | Yes | Percentage | Hidden when rates are real |
| Tax treatment | Yes | Toggle + rate | Applied only to taxable investment gains |
| Modeling mode | Yes | Deterministic/stochastic | Stochastic reveals simulation controls |

### Rate convention

The user must choose one internally consistent rate basis:

- **Nominal:** inflate future expenses and discount with the nominal rate.
- **Real:** keep expenses in analysis-date dollars and discount with the real
  rate. Inflation is not separately applied.

The UI blocks calculation when rate bases are mixed.

## 4. Flow specifications

### 4.1 Replacement timing

**Scenario:** A user owns a six-year-old vehicle, has positive equity, and wants
to know whether to keep it for two, four, or six more years.

| Step | Inputs | Progressive disclosure |
| --- | --- | --- |
| Current vehicle | Purchase/in-service date, current mileage, market value, loan payoff | Equity is calculated, never typed twice |
| Depreciation | Forecast method, annual values or annual rate | Advanced curve editor only for custom method |
| Operating costs | Maintenance schedule, annual insurance, registration, fuel/energy | Fuel details collapse into annual operating cost if user chooses simplified mode |
| Reliability | Failure events, probability, repair cost, downtime cost | Probability distributions appear only in stochastic mode |
| Replacement | Candidate replacement price, replacement operating cost, transaction costs | Needed to compare "keep" with "replace now" |
| Capital | Opportunity-cost toggle, return assumptions | Available only when current equity is positive |

**Blocking rules**

1. Loan payoff cannot be negative.
2. Opportunity cost cannot be enabled when market value minus payoff is zero or
   negative.
3. Depreciation forecasts cannot produce a negative vehicle value.
4. Failure probabilities must be between 0 and 1 and non-decreasing when they
   represent cumulative failure probability.

### 4.2 New car acquisition

**Scenario:** A user has cash available for a vehicle but wants to compare
paying cash, financing, and leasing while investing unused capital.

The headline output is **monthly ownership cost**, displayed side by side for
cash, loan, and lease. NPV remains part of the underlying calculation and
detail view, but it is not the primary decision metric.

| Step | Inputs | Progressive disclosure |
| --- | --- | --- |
| Vehicle | Price, taxes, fees, incentives, holding period, resale forecast | Incentive eligibility details appear when an incentive is entered |
| Cash | Cash price adjustments | Included by default |
| Loan | Down payment, APR, term, fees, prepayment, balloon | Balloon input appears only for balloon loans |
| Lease | Due at signing, term, payment, residual/buyout, mileage allowance, disposition fee | Excess mileage estimate appears when expected mileage exceeds allowance |
| Ownership costs | Insurance by path, maintenance, registration, energy | A shared value can be overridden per path |
| Investment overlay | Starting investable capital, return, volatility, tax rate, contribution timing | Volatility and simulation count appear only in stochastic mode |

Users may disable loan or lease paths. At least two acquisition paths must
remain enabled for a comparison.

**Primary visual**

- A ranked horizontal bar for each enabled path: `Cash`, `Loan`, and `Lease`.
- Each bar shows total monthly ownership cost and stacked contributions from
  vehicle cost, financing, taxes and fees, insurance, maintenance, energy, and
  opportunity cost.
- Resale proceeds, lease deposit refunds, and other terminal credits reduce the
  relevant segment rather than appearing as income.
- The lowest-cost path is highlighted with the monthly and total difference
  from every alternative.
- An `Include investment effects` toggle switches between vehicle-only monthly
  ownership cost and investment-adjusted monthly ownership cost. Both values
  remain visible in the detail table.

**Cash-flow convention**

- Time zero includes down payment, due-at-signing amounts, taxes, fees, and
  initial investment.
- Monthly payments occur at period end unless marked "paid in advance."
- Resale value, lease disposition, and investment liquidation occur at the end
  of the selected holding period.
- Refundable lease deposits are cash outflows at inception and inflows at
  return.

### 4.3 Used versus new

**Scenario:** A user is comparing a four-year-old vehicle with a current model
and needs repair risk included rather than hidden in an average maintenance
number.

The headline output is **monthly ownership cost for used versus new**. The used
vehicle is shown with both base and reliability-adjusted monthly cost so repair
risk remains explicit.

| Step | Inputs | Progressive disclosure |
| --- | --- | --- |
| Used vehicle | Price, model year, mileage, inspection/reconditioning, taxes/fees | Prior damage and warranty fields are optional advanced inputs |
| New benchmark | Price, incentives, taxes/fees, depreciation forecast | Can import a saved new-car scenario |
| Financing | Separate cash/loan terms for each vehicle | Shared loan defaults can be overridden |
| Ownership costs | Insurance, maintenance schedule, registration, energy for each | Difference view is the default |
| Reliability | Failure events, repair cost, probability, downtime | Distribution inputs appear only in stochastic mode |
| Exit assumptions | Holding period and resale forecast for both | Warn when forecast ages exceed available curve data |

The result must show both the raw ownership-cost gap and the
reliability-adjusted gap. Reliability cost is never silently folded into
maintenance.

**Primary visual**

- Two aligned stacked bars compare `Used` and `New` monthly ownership cost.
- Both bars use identical cost categories and scale so the visual difference is
  economically comparable.
- The used bar includes a distinct reliability segment. In stochastic mode, it
  also shows a percentile range around expected monthly ownership cost.
- A delta callout states the monthly and holding-period difference, for example:
  "Used costs $184 less per month, including expected repairs."
- A toggle switches between base, reliability-adjusted, and
  investment-adjusted views without changing scenario inputs.

## 5. Input interaction patterns

### Units and timing

- Store money in major currency units and rates as decimals (`0.07`, not `7`).
- Store terms in months and distance in the scenario's selected unit.
- Every recurring cost declares a frequency.
- Every future value declares the period in which it occurs.
- Convert display units at the boundary; calculations use the stored values.

### Defaults

Defaults must be visible and attributable:

| Default type | Display treatment |
| --- | --- |
| User-entered | Normal label |
| Derived | "Calculated" badge with formula tooltip |
| Market assumption | Source/date badge |
| Product default | "Estimate" badge and one-click edit |

Never treat a zero value as "not provided." Optional numeric fields use `null`
or are omitted.

### Validation

Validation has three levels:

1. **Field:** invalid ranges, missing units, impossible dates.
2. **Cross-field:** payoff exceeds value, lease mileage conflict, holding period
   exceeds lease term without a buyout.
3. **Model readiness:** insufficient depreciation years, no comparable paths,
   or stochastic mode without distributions.

Field errors are immediate. Cross-field errors appear after blur and in the
step summary. Model-readiness errors block `Calculate` and link directly to the
input that needs attention.

## 6. Review and results workspace

The review screen is a calculation manifest, not another form. It groups:

- vehicle facts;
- path-specific cash flows;
- shared economic assumptions;
- derived values;
- warnings and excluded costs.

Each group has an `Edit` action that returns to the originating step.

### Monthly ownership cost definition

For Stories 2A and 2B, monthly ownership cost is the equivalent level monthly
cost of owning or using the vehicle over the selected holding period:

```text
monthly rate = (1 + annual discount rate)^(1/12) - 1

monthly ownership cost =
  cost NPV / holding months                                  when rate = 0
  cost NPV * monthly rate / (1 - (1 + monthly rate)^-months) otherwise
```

`cost NPV` includes all path-specific acquisition, financing, operating, and
exit cash flows. Sale proceeds, refundable deposits, and positive terminal
equity reduce cost NPV. This produces a comparable monthly value even when cash,
loan, and lease payments occur at different times.

The UI must not label average monthly cash outflow as monthly ownership cost.
Average cash outflow may be shown as a secondary liquidity metric, because it
excludes depreciation, terminal value, and timing effects.

Two calculated variants are retained:

| Metric | Included costs | Use |
| --- | --- | --- |
| Vehicle-only monthly ownership cost | Acquisition/lease, financing, operating costs, taxes/fees, and terminal vehicle value | Default comparison |
| Investment-adjusted monthly ownership cost | Vehicle-only cost plus foregone or earned after-tax investment value | Opportunity-cost view |

For Story 2B, reliability-adjusted monthly ownership cost adds probability-
weighted repair and downtime cash flows. In stochastic mode, the headline is
the expected value and the visual also shows P10-P90 cost bounds.

### Results hierarchy

The results workspace uses the same five-region layout for all flows, but
Stories 2A and 2B prioritize monthly ownership cost:

| Region | Content |
| --- | --- |
| Decision | Optimal replacement time for Story 1; lowest monthly ownership cost and monthly delta for Stories 2A/2B |
| Monthly cost | Ranked stacked bars, cost-category breakdown, and comparison toggles |
| Economics | Cost NPV, total holding-period cost, average monthly cash outflow, and terminal value |
| Timeline | Cost curve and event markers |
| Uncertainty | Sensitivity tornado; percentile bands in stochastic mode |

Recommendations include the winning condition using the headline metric. For
example: "Loan costs $46 less per month than cash when after-tax investment
return exceeds 4.8%." NPV is available in the supporting detail and export.

## 7. Cross-flow handoffs

Users can branch without re-entry:

- Replacement result -> `Compare replacement vehicle`: carries replacement
  price and timing into the new-car flow.
- New-car result -> `Compare a used alternative`: carries horizon, economic
  assumptions, and new vehicle as benchmark.
- Used-vs-new result -> `Find replacement timing`: carries the selected vehicle
  and its forecast into the replacement flow.

Handoffs create a new scenario with `sourceScenarioId`; they never mutate the
source calculation.

## 8. Canonical state model

`schemas/calculator-input.schema.json` is the source of truth for persisted and
API-bound inputs. UI-only state such as expanded panels, field focus, and chart
selection must not be stored in the calculation payload.

The `flow` discriminator selects exactly one payload:

```text
replacement-timing -> replacementTiming
new-car-acquisition -> newCarAcquisition
used-vs-new         -> usedVsNew
```

Schema version changes are explicit. Saved scenarios require migrations rather
than permissive parsing or silent defaults.
