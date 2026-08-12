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
| Annual distance | Yes | Slider + number + mi/km | Must be positive; results update without leaving the workspace |
| Analysis horizon | Yes | Slider + input | Flow-specific presets may be shown in months; 1–30 years is supported |
| Discount rate | Yes | Percentage + explanation | Real or nominal, declared explicitly; never derived from vehicle depreciation |
| Inflation | Yes | Percentage | Hidden when rates are real |
| Modeling mode | Stories 1 and 2B | Deterministic/stochastic | Stochastic reveals reliability and cost-distribution controls |

### Rate convention

The user must choose one internally consistent rate basis:

- **Nominal:** inflate future expenses and discount with the nominal rate.
- **Real:** keep expenses in analysis-date dollars and discount with the real
  rate. Inflation is not separately applied.

The UI blocks calculation when rate bases are mixed.

Story 2A is deterministic. Its investment slider is a sensitivity input, not a
return distribution or simulation control.

The discount rate represents the time value of money: it converts cash flows at
different dates into comparable analysis-date dollars. It is not the inflation
rate, financing APR, investment return, or vehicle depreciation rate. A lease
residual may inform a resale forecast, but never the discount rate.

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
| Vehicle | Price, jurisdiction, taxes/mandatory fees, incentives, holding period, resale forecast | The holding-period slider defaults to 24/36/48-month comparison points; incentive source and eligibility appear when entered |
| Cash | Cash price adjustments | Included by default |
| Loan | User-selected down payment, APR, term, fees, prepayment | APR is adjustable; term presets are 36/48/60/72 months; origination fees are advanced and start at zero |
| Lease | Due-at-signing breakdown, first-payment treatment, term, payment, residual/buyout, mileage allowance, disposition fee | Residual is shown as both amount and percent of MSRP; mileage presets are 7,500/10,000/12,000/15,000 per year |
| Ownership costs | Optional insurance, maintenance, annual government charges, energy | Insurance is disabled until explicitly included; a shared value can be overridden per path |
| Investment overlay | Available initial capital and gross annual return | Asked early and enabled by default only after the user confirms cash is available; return uses an editable slider defaulted to 10% |

Users may disable loan or lease paths. At least two acquisition paths must
remain enabled for a comparison.

Loan down payment has no normative product default. The UI may explain that a
larger down payment lowers loan-to-value, interest, and negative-equity risk,
but it must not label 20% as universally recommended. When investment effects
are enabled, the result instead shows the return at which investing additional
cash is projected to outperform using it as a down payment.

Purchase taxes use a jurisdiction profile. The profile can supply a percentage,
cap, fixed charge, or combination; users can edit the calculated amount. A
generic percentage slider is shown only where the jurisdiction actually uses
an uncapped percentage. Annual property tax, registration, and mandatory
surcharges remain recurring ownership costs rather than purchase tax.

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
- A separate equity section aligns each path's vehicle market value, loan or
  buyout liability, resulting vehicle equity, and gross investment balance.
  These values are not labeled household net worth and are not silently summed
  into monthly ownership cost.

**Cash-flow convention**

- Time zero includes down payment, due-at-signing amounts, taxes, fees, and
  initial investment.
- Monthly payments occur at period end unless marked "paid in advance."
- When due at signing includes the first lease payment, that payment is not
  counted again in the recurring payment schedule.
- Resale value and lease disposition occur at the end of the selected holding
  period.
- Refundable lease deposits are cash outflows at inception and inflows at
  return.
- A holding period shorter than the lease term is not comparable unless an
  early-termination or buyout quote is supplied for that date. At lease
  maturity, the user selects return or buyout. A holding period longer than the
  lease term requires a buyout or replacement-lease path. Disposition fees
  apply only when the contract requires them.
- The initial-capital opportunity-cost view starts every path with the same
  available capital, invests only the amount unused at time zero, and assumes no
  monthly investment contributions. Vehicle equity and investment balance are
  reported separately. A future household-budget model may add equal monthly
  budgets, but it is a distinct comparison and must not be mixed into this view.
- Investment growth is gross and unrealized: no sale or capital-gains tax is
  modeled. For Flow 2A's whole-year horizons, the balance is
  `principal * (1 + annual return)^years`. The 10% return is a visible editable
  product estimate, not a guaranteed forecast.

#### Flow 2A numerical validation snapshot

The following sample validates calculation and interaction requirements; it is
not a market quote or financial recommendation.

| Assumption | Test value |
| --- | ---: |
| MSRP / dealer incentive applying to all paths | $46,630 / $7,500 |
| Cash/loan out-the-door acquisition | $42,000, including the $500 South Carolina IMF and $2,370 additional purchase costs |
| Holding-period slider / annual distance | 24, 36, 48 months / 7,000 miles |
| Rate basis | Analysis-date dollars, 1.5% real discount |
| Conservative resale proxy | $29,369.40 at month 36; exponential interpolation/extrapolation |
| Loan | $8,400 sample down payment (20%), $33,600 principal, 3.99% APR, 60 months, $618.64 payment |
| Lease | $4,118.15 due at signing including first payment; 35 later payments of $368.15; 36 months |
| Lease end | $29,369.40 buyout plus $500 South Carolina IMF, or $395 disposition fee on return |
| Ownership costs | $1,423.44 annual combined government charges; $220 annual energy; insurance and maintenance excluded |
| Initial-capital overlay | $42,000; 10% gross annual return; yearly compounding; no monthly contributions, sale, or tax |

The residual is a contractual buyout value, not a market-value guarantee. This
test uses it only as a conservative month-36 resale proxy, implying an
extrapolated value of $34,262 at month 24 and $25,175 at month 48.
The $1,423.44 government-charge estimate is repeated annually in analysis-date
dollars. The $2,370 additional purchase-cost input is a user-directed balancing
amount, not a South Carolina estimate; a production scenario should require its
fee labels or quote source instead of silently grouping it.

**Vehicle-only equivalent monthly ownership cost**

| Horizon | Cash | Loan | Lease |
| ---: | ---: | ---: | ---: |
| 24 months | $506 | $564 | Not comparable without a month-24 exit quote |
| 36 months | $532 | $583 | $622 return / $625 buyout |
| 48 months | $529 | $573 | $599 after month-36 buyout |

At a deterministic 10% gross investment return, the initial-capital opportunity cost
changes the ranking:

| Horizon | Cash | Loan | Lease |
| ---: | ---: | ---: | ---: |
| 24 months | $868 | $636 | Not comparable |
| 36 months | $909 | $658 | $659 return / $662 buyout |
| 48 months | $923 | $652 | $638 after buyout |

The 10% gross investment balances, displayed separately from vehicle equity,
are:

| Horizon | Cash | Loan | Lease |
| ---: | ---: | ---: | ---: |
| 24 months | $0 | $40,656 | Not comparable |
| 36 months | $0 | $44,722 | $50,421 |
| 48 months | $0 | $49,194 | $55,463 |

Vehicle equity at 24/36/48 months is $34,262/$29,369/$25,175 for cash,
$13,305/$15,122/$17,909 after loan payoff, and zero after lease return. A lease
buyout places the vehicle value in the equity column after the buyout liability
is paid.

The investment-adjusted calculation adds the discounted gross gain
foregone on each path's time-zero vehicle outlay to vehicle-only cost NPV.
Unused-capital balances remain a separate equity disclosure, preventing the UI
from presenting the result as household net worth.

Validation references:

- [South Carolina maximum tax and infrastructure maintenance fee](https://dor.sc.gov/sales-use-tax-index/maximum-tax-max-tax)
- [CFPB: loan-to-value in an auto loan](https://www.consumerfinance.gov/ask-cfpb/what-is-a-loan-to-value-ratio-in-an-auto-loan-en-769/)

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
| Product default | "Estimate" badge and one-click edit; never a normative recommendation |

Never treat a zero value as "not provided." Optional numeric fields use `null`
or are omitted.

### Validation

Validation has three levels:

1. **Field:** invalid ranges, missing units, impossible dates.
2. **Cross-field:** payoff exceeds value, lease mileage conflict, holding period
   falls before lease maturity without an exit quote, reaches maturity without
   return or buyout selection, or exceeds lease term without a buyout or
   replacement-lease path.
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
| Investment-adjusted monthly ownership cost | Vehicle-only cost plus foregone gross investment growth | Opportunity-cost view |

For Story 2B, reliability-adjusted monthly ownership cost adds probability-
weighted repair and downtime cash flows. In stochastic mode, the headline is
the expected value and the visual also shows P10-P90 cost bounds.

### Results hierarchy

The results workspace uses the same six-region layout for all flows, but
Stories 2A and 2B prioritize monthly ownership cost:

| Region | Content |
| --- | --- |
| Decision | Optimal replacement time for Story 1; lowest monthly ownership cost and monthly delta for Stories 2A/2B |
| Monthly cost | Ranked stacked bars, cost-category breakdown, and comparison toggles |
| Equity | Vehicle value, financing/buyout liability, vehicle equity, and gross investment balance by path |
| Economics | Cost NPV, total holding-period cost, average monthly cash outflow, and terminal value |
| Timeline | Cost curve and event markers |
| Uncertainty | Sensitivity tornado; percentile bands in stochastic mode |

Recommendations include the winning condition using the headline metric. For
example: "Loan costs $46 less per month than cash when gross annual investment
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

Version 2 removes consumer balloon-loan input, records whether a lease's first
payment is included at signing, separates purchase taxes from recurring
government charges, requires lease term-end strategy, and simplifies investment
inputs to starting capital plus gross annual return. Its migration converts
`horizonYears` to `horizonMonths` by
multiplying by 12, expands a numeric incentive into an attributed path-specific
incentive array, supplies a tax jurisdiction, and converts annual registration
to a government-charge schedule. Version 1 scenarios require this explicit
migration before calculation.
