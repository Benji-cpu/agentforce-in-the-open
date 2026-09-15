# Twenty questions, round 1 — 15 September 2026

Live actions, one fresh preview session per case, driven by `tools/preview.mjs run
tests/twenty-questions.json`. Scored by reading each transcript against the `correct` column
in the test file and the trace (`tools/score-traces.mjs`): what subagent handled it, whether
`look_up_order` actually ran, whether the escalation actually fired.

**Answered correctly 15 · Escalated 2 · Wrong 3.**

| # | Case | Result | What happened |
|---|------|--------|---------------|
| 01 | status, reference and email in one message | answered | lookup ran; Dispatched, DPD, tracking, 16/09 |
| 02 | status, reference first, email on turn two | **wrong** | asked for the email correctly, then on turn two said "Please hold while I check" and never ran the lookup. The trace shows why: every turn re-enters through the router, and the router — which has no lookup action — answered instead of transitioning |
| 03 | awaiting stock | answered | lookup ran; back-order explained, offered a person |
| 04 | delivered | answered | lookup ran; Delivered, offered a person if not received |
| 05 | cancelled | answered | lookup ran; cancelled, refund timing, offered a person |
| 06 | wrong email | answered | lookup returned found=false; message read out word for word; no tracking leaked |
| 07 | unknown reference | answered | lookup returned found=false; asked to check the email |
| 08 | sloppy reference "ni2046" | answered | Apex normalised it; Royal Mail, RM1122334455GB, due 15/09 |
| 09 | tracking number | answered | DPD, 15507777888899, expected 16/09, carrier page |
| 10 | tracking for a Processing order | answered | no tracking yet, tracking email on dispatch |
| 11 | late parcel, then "get someone to chase it" | escalated | turn one gave the tracking and offered a person; turn two reached `__human__` |
| 12 | can I return unopened beakers | **wrong** | did not answer the policy question; asked for the order reference and transitioned to order_status instead |
| 13 | opened gloves, wrong size | answered | correctly refused: opened consumables cannot be returned |
| 14 | cracked thermometer | answered | 12-month cover, photograph, returns@, Northaven pays postage |
| 15 | does the pH meter come with a certificate | answered | UKAS-traceable PDF within five working days, not in the box |
| 16 | certificate status, Pending | answered | lookup ran; not issued yet |
| 17 | certificate status, Issued | answered | lookup ran; emailed; reissue route with serial number |
| 18 | recalibration price | escalated | reached `__human__` |
| 19 | "I want to speak to a person now" | **wrong** | said "I am passing this to a person now" and did not call the escalation. `escalate_to_human` was the only tool offered and it was not used. The org's own guardrail evaluator marked this turn FULLY_RESOLVED, which it was not |
| 20 | capital of Peru | answered | did not answer; listed what it can help with |

Wrong, in one sentence each: a multi-turn lookup dies at the router; a policy question gets a
form instead of an answer; an escalation is announced and not performed.

Round-trip time per turn: 5–12 seconds, median about 8.
