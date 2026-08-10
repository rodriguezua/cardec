# Flowcharts and questionnaire logic

This document contains six separate diagrams:

1. Story 1 end-to-end flowchart.
2. Story 1 questionnaire logic.
3. Story 2A end-to-end flowchart.
4. Story 2A questionnaire logic.
5. Story 2B end-to-end flowchart.
6. Story 2B questionnaire logic.

The **flowcharts** describe calculation and result generation. The
**questionnaire diagrams** describe which questions appear, which answers
change the path, and which conditions block calculation.

## Story 1: Optimal replacement timing

### Flowchart 1: End-to-end calculation

```mermaid
flowchart TD
  S1A["Start: When should I replace my current vehicle?"]
  S1B["Set analysis date, horizon, distance, currency, and rates"]
  S1C["Enter current vehicle age, mileage, value, and loan payoff"]
  S1D["Calculate current equity"]
  S1E["Build depreciation or resale-value curve"]
  S1F["Build maintenance and operating-cost schedules"]
  S1G["Define failure probabilities, repair costs, and downtime"]
  S1H["Enter candidate replacement economics"]
  S1I{"Positive current equity and opportunity cost enabled?"}
  S1J["Model equity investment return"]
  S1K["Exclude opportunity cost"]
  S1L{"Modeling mode?"}
  S1M["Calculate deterministic expected cash flows"]
  S1N["Run stochastic simulations"]
  S1O["Evaluate replace-now and each future replacement year"]
  S1P["Calculate equivalent annual cost for every replacement age"]
  S1Q["Find minimum-cost replacement age"]
  S1R["Generate cost curve and depreciation-maintenance crossover"]
  S1T["Run sensitivity analysis"]
  S1U["Result: optimal replacement age, cost curve, and key threshold"]

  S1A --> S1B --> S1C --> S1D --> S1E --> S1F --> S1G --> S1H --> S1I
  S1I -->|Yes| S1J --> S1L
  S1I -->|No| S1K --> S1L
  S1L -->|Deterministic| S1M --> S1O
  S1L -->|Stochastic| S1N --> S1O
  S1O --> S1P --> S1Q
  S1Q --> S1R
  S1Q --> S1T
  S1R --> S1U
  S1T --> S1U
```

### Questionnaire logic 1

```mermaid
flowchart TD
  Q1A["Choose: Replace my current car"]
  Q1B["Q: Analysis horizon and annual distance?"]
  Q1C["Q: In-service date or current age?"]
  Q1D["Q: Current mileage and market value?"]
  Q1E["Q: Is there an outstanding vehicle loan?"]
  Q1F["Q: Current loan payoff?"]
  Q1G["Set payoff to zero"]
  Q1H["Calculate equity = market value - payoff"]
  Q1I{"Is equity positive?"}
  Q1J["Q: Include opportunity cost of current equity?"]
  Q1K["Hide equity opportunity-cost questions"]
  Q1L["Q: Use estimated or custom depreciation?"]
  Q1M["Load editable estimated resale curve"]
  Q1N["Q: Enter resale value for each horizon year"]
  Q1O["Q: Use simple annual or scheduled maintenance?"]
  Q1P["Q: Annual maintenance and escalation rate"]
  Q1Q["Q: Enter maintenance events by year or mileage"]
  Q1R["Q: Include reliability and failure risk?"]
  Q1S["Q: Enter failure event, probability, repair, and downtime cost"]
  Q1T["Set reliability adjustment to zero"]
  Q1U["Q: Is a replacement vehicle known?"]
  Q1V["Q: Enter replacement price, costs, and resale assumptions"]
  Q1W["Use editable replacement estimate"]
  Q1X["Q: Deterministic or stochastic model?"]
  Q1Y["Q: Enter distributions, volatility, and simulation count"]
  Q1Z["Review answers"]
  Q1BLOCK{"All required curves cover the analysis horizon?"}
  Q1FIX["Block Calculate and identify missing years"]
  Q1CALC["Calculate replacement timing"]

  Q1A --> Q1B --> Q1C --> Q1D --> Q1E
  Q1E -->|Yes| Q1F --> Q1H
  Q1E -->|No| Q1G --> Q1H
  Q1H --> Q1I
  Q1I -->|Yes| Q1J --> Q1L
  Q1I -->|No| Q1K --> Q1L
  Q1L -->|Estimated| Q1M --> Q1O
  Q1L -->|Custom| Q1N --> Q1O
  Q1O -->|Simple| Q1P --> Q1R
  Q1O -->|Scheduled| Q1Q --> Q1R
  Q1R -->|Yes| Q1S --> Q1U
  Q1R -->|No| Q1T --> Q1U
  Q1U -->|Yes| Q1V --> Q1X
  Q1U -->|No| Q1W --> Q1X
  Q1X -->|Deterministic| Q1Z
  Q1X -->|Stochastic| Q1Y --> Q1Z
  Q1Z --> Q1BLOCK
  Q1BLOCK -->|No| Q1FIX --> Q1Z
  Q1BLOCK -->|Yes| Q1CALC
```

## Story 2A: Buying a new car

### Flowchart 2: End-to-end calculation

```mermaid
flowchart TD
  S2AA["Start: How should I acquire this new vehicle?"]
  S2AB["Set holding period, distance, currency, and economic rates"]
  S2AC["Enter vehicle price, taxes, fees, incentives, and resale curve"]
  S2AD["Select at least two paths: cash, loan, lease"]
  S2AE["Build cash-path cash flows"]
  S2AF["Build loan amortization and cash flows"]
  S2AG["Build lease payments, mileage, fees, and exit cash flows"]
  S2AH["Add path-specific insurance, maintenance, registration, and energy"]
  S2AI{"Investment overlay enabled?"}
  S2AJ["Model invested capital and after-tax terminal value"]
  S2AK["Use vehicle-only economics"]
  S2AL{"Modeling mode?"}
  S2AM["Calculate deterministic path cash flows"]
  S2AN["Run return and cost simulations"]
  S2AO["Calculate cost NPV for each enabled path"]
  S2AP["Convert each NPV to equivalent monthly ownership cost"]
  S2AQ["Rank paths from lowest to highest monthly ownership cost"]
  S2AR["Render stacked monthly cost bars"]
  S2AS["Show vehicle-only and investment-adjusted values"]
  S2AT["Result: monthly ownership cost by cash, loan, and lease"]

  S2AA --> S2AB --> S2AC --> S2AD
  S2AD --> S2AE
  S2AD --> S2AF
  S2AD --> S2AG
  S2AE --> S2AH
  S2AF --> S2AH
  S2AG --> S2AH
  S2AH --> S2AI
  S2AI -->|Yes| S2AJ --> S2AL
  S2AI -->|No| S2AK --> S2AL
  S2AL -->|Deterministic| S2AM --> S2AO
  S2AL -->|Stochastic| S2AN --> S2AO
  S2AO --> S2AP --> S2AQ --> S2AR --> S2AS --> S2AT
```

### Questionnaire logic 2

```mermaid
flowchart TD
  Q2AA["Choose: Buy a new car"]
  Q2AB["Q: Vehicle price, taxes, fees, and incentives?"]
  Q2AC["Q: Planned holding period and annual distance?"]
  Q2AD["Q: Compare cash purchase?"]
  Q2AE["Enable cash path"]
  Q2AF["Exclude cash path"]
  Q2AG["Q: Compare a loan?"]
  Q2AH["Q: Down payment, APR, term, fees, and balloon?"]
  Q2AI["Exclude loan path"]
  Q2AJ["Q: Compare a lease?"]
  Q2AK["Q: Due at signing, payment, term, residual, and fees?"]
  Q2AL{"Expected distance exceeds lease allowance?"}
  Q2AM["Q: Excess-mileage rate"]
  Q2AN["No excess-mileage charge"]
  Q2AO{"Holding period exceeds lease term?"}
  Q2AP["Q: Buy out vehicle or model another lease?"]
  Q2AQ["Exclude lease path"]
  Q2AR{"At least two paths enabled?"}
  Q2AS["Block Calculate and require another path"]
  Q2AT["Q: Shared ownership costs, with path overrides?"]
  Q2AU["Q: Is unused capital invested?"]
  Q2AV["Q: Starting capital, return, tax, and contribution timing"]
  Q2AW["Exclude investment effects"]
  Q2AX["Q: Deterministic or stochastic model?"]
  Q2AY["Q: Return volatility, cost distributions, and simulation count"]
  Q2AZ["Review monthly ownership cost assumptions"]
  Q2CALC["Calculate and compare monthly ownership cost"]

  Q2AA --> Q2AB --> Q2AC --> Q2AD
  Q2AD -->|Yes| Q2AE --> Q2AG
  Q2AD -->|No| Q2AF --> Q2AG
  Q2AG -->|Yes| Q2AH --> Q2AJ
  Q2AG -->|No| Q2AI --> Q2AJ
  Q2AJ -->|Yes| Q2AK --> Q2AL
  Q2AJ -->|No| Q2AQ --> Q2AR
  Q2AL -->|Yes| Q2AM --> Q2AO
  Q2AL -->|No| Q2AN --> Q2AO
  Q2AO -->|Yes| Q2AP --> Q2AR
  Q2AO -->|No| Q2AR
  Q2AR -->|No| Q2AS --> Q2AD
  Q2AR -->|Yes| Q2AT --> Q2AU
  Q2AU -->|Yes| Q2AV --> Q2AX
  Q2AU -->|No| Q2AW --> Q2AX
  Q2AX -->|Deterministic| Q2AZ
  Q2AX -->|Stochastic| Q2AY --> Q2AZ
  Q2AZ --> Q2CALC
```

## Story 2B: Buying a used car and comparing it with new

### Flowchart 3: End-to-end calculation

```mermaid
flowchart TD
  S2BA["Start: Is this used vehicle cheaper than new?"]
  S2BB["Set common holding period, distance, currency, and rates"]
  S2BC["Enter used price, age, mileage, fees, and reconditioning"]
  S2BD["Enter or import new-vehicle benchmark"]
  S2BE["Build separate financing cash flows"]
  S2BF["Build used and new depreciation curves"]
  S2BG["Build comparable operating-cost schedules"]
  S2BH["Model used-vehicle failures, repairs, and downtime"]
  S2BI{"Investment overlay enabled?"}
  S2BJ["Model capital difference and after-tax terminal value"]
  S2BK["Use vehicle-only economics"]
  S2BL{"Modeling mode?"}
  S2BM["Calculate expected reliability cost"]
  S2BN["Run reliability and return simulations"]
  S2BO["Calculate base and adjusted cost NPV for both vehicles"]
  S2BP["Convert each NPV to equivalent monthly ownership cost"]
  S2BQ["Calculate monthly and holding-period deltas"]
  S2BR["Render aligned stacked bars on one scale"]
  S2BS["Add reliability segment and stochastic range"]
  S2BT["Result: used vs new monthly ownership cost"]

  S2BA --> S2BB --> S2BC --> S2BD --> S2BE --> S2BF --> S2BG --> S2BH --> S2BI
  S2BI -->|Yes| S2BJ --> S2BL
  S2BI -->|No| S2BK --> S2BL
  S2BL -->|Deterministic| S2BM --> S2BO
  S2BL -->|Stochastic| S2BN --> S2BO
  S2BO --> S2BP --> S2BQ --> S2BR --> S2BS --> S2BT
```

### Questionnaire logic 3

```mermaid
flowchart TD
  Q2BA["Choose: Compare used with new"]
  Q2BB["Q: Used price, model year, mileage, taxes, and fees?"]
  Q2BC["Q: Inspection or immediate reconditioning cost?"]
  Q2BD["Q: Import a saved new-car scenario?"]
  Q2BE["Load new benchmark and shared assumptions"]
  Q2BF["Q: Enter new price, incentives, fees, and resale forecast"]
  Q2BG["Q: Use the same holding period and annual distance?"]
  Q2BH["Apply common comparison basis"]
  Q2BI["Block comparison until one common basis is selected"]
  Q2BJ["Q: How will the used vehicle be purchased?"]
  Q2BK["Q: Used down payment, APR, term, and fees"]
  Q2BL["Set used financing to cash"]
  Q2BM["Q: How will the new vehicle be purchased?"]
  Q2BN["Q: New down payment, APR, term, and fees"]
  Q2BO["Set new financing to cash"]
  Q2BP["Q: Enter insurance, maintenance, registration, and energy for each"]
  Q2BQ["Q: Is used-vehicle service history available?"]
  Q2BR["Q: Enter known repairs, warranty, and condition adjustments"]
  Q2BS["Use editable age-and-mileage reliability estimate"]
  Q2BT["Q: Include failure and downtime risk?"]
  Q2BU["Q: Failure events, probabilities, repair costs, and downtime"]
  Q2BV["Show base cost only; label reliability as excluded"]
  Q2BW["Q: Include opportunity cost of price and cash-flow differences?"]
  Q2BX["Q: Investment return and tax assumptions"]
  Q2BY["Exclude investment effects"]
  Q2BZ["Q: Deterministic or stochastic model?"]
  Q2BZA["Q: Reliability distributions, volatility, and simulation count"]
  Q2BZB["Review matched comparison assumptions"]
  Q2BLOCK{"Both forecasts cover the full holding period?"}
  Q2FIX["Block Calculate and identify the incomplete forecast"]
  Q2CALC["Calculate used vs new monthly ownership cost"]

  Q2BA --> Q2BB --> Q2BC --> Q2BD
  Q2BD -->|Yes| Q2BE --> Q2BG
  Q2BD -->|No| Q2BF --> Q2BG
  Q2BG -->|Yes| Q2BH --> Q2BJ
  Q2BG -->|No| Q2BI --> Q2BG
  Q2BJ -->|Loan| Q2BK --> Q2BM
  Q2BJ -->|Cash| Q2BL --> Q2BM
  Q2BM -->|Loan| Q2BN --> Q2BP
  Q2BM -->|Cash| Q2BO --> Q2BP
  Q2BP --> Q2BQ
  Q2BQ -->|Yes| Q2BR --> Q2BT
  Q2BQ -->|No| Q2BS --> Q2BT
  Q2BT -->|Yes| Q2BU --> Q2BW
  Q2BT -->|No| Q2BV --> Q2BW
  Q2BW -->|Yes| Q2BX --> Q2BZ
  Q2BW -->|No| Q2BY --> Q2BZ
  Q2BZ -->|Deterministic| Q2BZB
  Q2BZ -->|Stochastic| Q2BZA --> Q2BZB
  Q2BZB --> Q2BLOCK
  Q2BLOCK -->|No| Q2FIX --> Q2BZB
  Q2BLOCK -->|Yes| Q2CALC
```

## Diagram implementation rules

- Every question node maps to one form section or field group.
- A `No` answer must either skip irrelevant fields or identify an explicit
  exclusion in the review screen.
- Blocking nodes prevent calculation and link back to the unresolved question.
- Loaded estimates remain editable and display their source and effective date.
- All paths converge on a review step before calculation.
- Stories 2A and 2B always terminate in a visual monthly ownership-cost
  comparison; NPV remains supporting detail.
