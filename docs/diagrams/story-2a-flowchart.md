# Story 2A: New-car acquisition flowchart

[Back to diagram index](../flow-diagrams.md)

```mermaid
flowchart TD
  S2AA["Start: How should I acquire this new vehicle?"]
  S2AB["Set 24/36/48-month comparison points, distance, currency, and real or nominal rates"]
  S2AC["Enter vehicle price, jurisdiction-aware taxes, incentives, and resale curve"]
  S2AD["Select at least two paths: cash, loan, lease"]
  S2AE["Build cash-path cash flows"]
  S2AF["Build loan amortization and cash flows"]
  S2AG["Build lease payments, mileage, fees, and term-boundary exit cash flows"]
  S2AH["Add optional insurance, maintenance, government charges, and energy"]
  S2AI{"Investment overlay enabled?"}
  S2AJ["Apply gross annual return to unused initial capital with yearly compounding"]
  S2AK["Use vehicle-only economics"]
  S2AM["Calculate deterministic path cash flows"]
  S2AO["Calculate cost NPV for each enabled path"]
  S2AP["Convert each NPV to equivalent monthly ownership cost"]
  S2AQ["Rank comparable paths from lowest to highest monthly ownership cost"]
  S2AR["Render stacked monthly cost bars"]
  S2AS["Show vehicle-only and investment-adjusted values plus separate vehicle and investment equity"]
  S2AT["Result: monthly ownership cost by cash, loan, and lease"]

  S2AA --> S2AB --> S2AC --> S2AD
  S2AD --> S2AE
  S2AD --> S2AF
  S2AD --> S2AG
  S2AE --> S2AH
  S2AF --> S2AH
  S2AG --> S2AH
  S2AH --> S2AI
  S2AI -->|Yes| S2AJ --> S2AM
  S2AI -->|No| S2AK --> S2AM
  S2AM --> S2AO
  S2AO --> S2AP --> S2AQ --> S2AR --> S2AS --> S2AT
```
