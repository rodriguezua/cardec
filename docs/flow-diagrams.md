# Flowcharts and questionnaire logic

Each diagram is stored in a separate file so GitHub can render and review it
independently.

| Story | End-to-end calculation | Questionnaire logic |
| --- | --- | --- |
| Story 1: Optimal replacement timing | [Flowchart](diagrams/story-1-flowchart.md) | [Questionnaire](diagrams/story-1-questionnaire.md) |
| Story 2A: Buying a new car | [Flowchart](diagrams/story-2a-flowchart.md) | [Questionnaire](diagrams/story-2a-questionnaire.md) |
| Story 2B: Used versus new | [Flowchart](diagrams/story-2b-flowchart.md) | [Questionnaire](diagrams/story-2b-questionnaire.md) |

The **flowcharts** describe calculation and result generation. The
**questionnaire diagrams** describe which questions appear, which answers
change the path, and which conditions block calculation.

## Diagram implementation rules

- Every question node maps to one form section or field group.
- A `No` answer must either skip irrelevant fields or identify an explicit
  exclusion in the review screen.
- Blocking nodes prevent calculation and link back to the unresolved question.
- Loaded estimates remain editable and display their source and effective date.
- All paths converge on a review step before calculation.
- Stories 2A and 2B always terminate in a visual monthly ownership-cost
  comparison; NPV remains supporting detail.
