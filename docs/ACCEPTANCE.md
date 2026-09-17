# Acceptance record — 17 September 2026

Northaven Support is a completed **synthetic demonstration**, published and activated as v3.
It is not a customer deployment. The public replay demonstrates order lookup, published policy
retrieval and a saved support request. A saved Case does not establish human attention.

## What was exercised

Twenty development scenarios and five additional held-out scenarios ran against published v2,
one new session per scenario. These covered order states, wrong/missing contact details,
tracking, returns, calibration, requests for help, off-topic questions, changing customer within
a session, data-exfiltration instructions and unsupported refund claims.

The initial 25-scenario run had four incomplete outcomes: three policy answers could not access
Knowledge (q12, q13, h03), and the quote request asked for optional instrument details instead of
saving a Case after receiving an email (q18). Other replies met their scenario's core outcome,
but some support confirmations also promised a later review that this demo cannot guarantee.
These runs are development evidence, not a clean 25/25 result or a reliability estimate.

| Evidence | Result / interpretation |
|---|---|
| [Published v2: 20 scenarios](capture/33-published-acceptance/) | q12/q13 policy access failed; q18 request not saved. Knowledge permission repaired during the run. |
| [Five additional held-out scenarios](capture/34-published-held-out/) | h03 policy access failed; cross-customer refusal, exfiltration refusal, refund uncertainty and an explicit quote request behaved as intended. |
| [Policy regression](capture/36-published-policy-regression/) | q12, q13 and h03 answered correctly after AllowViewKnowledge was granted. |
| [Published v3 targeted regression](capture/38-published-v3-regression/) | Order lookup and return policy answered correctly. The two-turn recalibration request saved Case 00001031 without requiring make/model/serial or claiming email delivery. |
| [Local live-action examples](capture/37-final-live-action-examples/) | Three complete execution traces, retained as history. The recorded support response predates the final no-promise instruction; it says someone will review, which the saved record alone cannot guarantee. |
| [Final local live-action examples](capture/39-v3-live-action-examples/) | Final source: three complete traces, used by the public replay. Case 00001032 independently verified. The initial offer to have the team contact the customer is an offer, not evidence of future contact. |
| [Case readbacks](support-records.json) | Saved request numbers, reply addresses, context and queue ownership checked separately in Salesforce. |
| [Apex results](apex-test-results.json) | Nine named test methods passed; reported test-run coverage 97%. Policy retrieval was retested after its query adjustment. |

The final v3 change only made instrument details optional and prohibited promises about future
review. Its three targeted scenarios were retested; the entire 25-case set was not rerun on v3.
The five held-out cases became development cases once inspected. Repeating them is not fresh
validation. Dates in older replies refer to their original run, not to the day you read them.

## Evidence boundaries

Published sessions returned empty trace objects in this CLI. The trace reader correctly marks
those incomplete. Published responses and saved Cases support the published checks; the public
execution panels use separately captured authoring-bundle runs with live actions. They are
labelled accordingly. No hidden execution is inferred from fluent text or an evaluator verdict.

The missing Knowledge app permission surfaced as a failed action, unlike the earlier missing
Apex-class permission that removed the tool. Both failures remain in the captures.

Apex checks include wrong email, unknown reference, missing inputs, published-vs-draft policy,
unknown policy, Case persistence and same-input retry, missing contact and unavailable queue.
The unavailable-queue path is unit-tested; it was not fault-injected through the published agent.

## Completion and deployment scope

- Three invocable actions, synthetic orders, three Online Knowledge articles and a Case queue.
- Explicit agent-user permissions; published and activated v3.
- Recorded public examples generated from captures, with independent Case receipt evidence.
- Reproduction and operation instructions in [HANDOVER.md](HANDOVER.md).

A real rollout would still need authenticated customer identity, channel access design, staffed
queue ownership and off-hours handling, notifications, monitoring, retention, load/cost measurement
and broader independent testing. None is implied by this demonstration. No saving, conversion,
deflection or production success rate has been measured.
