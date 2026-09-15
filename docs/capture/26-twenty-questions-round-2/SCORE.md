# Twenty questions, round 2 — 15 September 2026

Same twenty cases, same harness, after three instruction changes and nothing else
(`docs/capture/25-round2-instruction-diff.txt`): the router never answers and treats a bare
email or reference as the answer to its own question; the returns subagent answers the policy
question before asking for anything; the escalation subagent is told to call the hand-off in
the same turn rather than announce it.

**Answered correctly 17 · Escalated 2 · Wrong 1.**

| # | Case | Round 1 | Round 2 | What changed |
|---|------|---------|---------|--------------|
| 02 | status over two turns | wrong | **answered** | turn two now transitions to order_status and the lookup runs: Processing, dispatch within two working days, expected 19/09 |
| 12 | return unopened beakers | wrong | **answered** | policy answered in the same turn: 30 days, unopened, customer pays postage, returns@ |
| 19 | "I want to speak to a person now" | wrong | **wrong** | "I will put you through to a person now." — and did not. Same trace shape as round 1: escalation subagent entered, `escalate_to_human` the only tool, not called. Telling the model to call it in the same turn did nothing |
| all others | 15 answered, 2 escalated | 15 answered, 2 escalated | unchanged |

The remaining failure is the one the Salesforce pattern library calls "promised human handoff":
the instruction promises a transfer and the model narrates it instead of performing it. Their
fix is structural, not textual — put `@utils.escalate` in the router's own action list so the
hand-off is a one-step choice rather than a transition followed by a second decision. Round 3
tests that.
