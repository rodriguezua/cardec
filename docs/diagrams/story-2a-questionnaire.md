# Story 2A: New-car acquisition questionnaire

[Back to diagram index](../flow-diagrams.md)

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
