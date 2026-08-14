# Flowcharts and questionnaire logic

Each diagram is stored in a separate file so GitHub can render and review it
independently.

These diagrams model calculation sequencing and conditional information
requirements for the planned web application. They are being used to test
whether the concept captures every required assumption and branch. They do not
prescribe the final screens, controls, or navigation. Those UI decisions will
be reviewed after the calculation and statistical methods are validated.

| Story | End-to-end calculation | Questionnaire logic |
| --- | --- | --- |
| Story 1: Optimal replacement timing | [Flowchart](diagrams/story-1-flowchart.md) | [Questionnaire](diagrams/story-1-questionnaire.md) |
| Story 2A: Buying a new car | [Flowchart](diagrams/story-2a-flowchart.md) | [Questionnaire](diagrams/story-2a-questionnaire.md) |
| Story 2B: Used versus new | [Flowchart](diagrams/story-2b-flowchart.md) | [Questionnaire](diagrams/story-2b-questionnaire.md) |

The **flowcharts** describe calculation and result generation. The
**questionnaire diagrams** describe which information is conditionally required,
which answers change the path, and which conditions block calculation. A
question node does not require a one-question-per-screen UI.

## Diagram interpretation rules

- Every question node represents information the model may require; UI grouping
  is intentionally deferred.
- A `No` branch records an explicit model exclusion rather than silently
  assuming a zero value.
- Blocking nodes identify missing inputs that make the calculation invalid.
- Loaded estimates retain their source and effective date.
- All paths converge on a complete calculation manifest before execution.
- Stories 2A and 2B always terminate in a visual monthly ownership-cost
  comparison; NPV remains supporting detail.
