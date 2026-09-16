# Review regression run — 16 September 2026

Local authoring-bundle preview with live Apex actions, one fresh session per case. Twenty cases,
22 turns. Changed all four business-subagent `hand_to_person` actions from a transition to direct
`@utils.escalate`. The Apex refusal wording was also corrected. Published v1 was not changed.

## Result

**14 complete replies, 3 partial replies, 3 preview escalation events.** No narrated-but-unexecuted
handoff occurred in this run. This is one run of a reused development set, not a success-rate claim.

Under the earlier, looser “answered” category, this would read 17 / 3 / 0. We do not use that as a
20-of-20 headline: three answers omit details named in the existing `correct` rubric.

| Cases | Assessment |
|---|---|
| q01–q03 | Expected order facts; q02 asks for email before lookup |
| q04 | Partial: reports Delivered but omits the 5 September date requested by the rubric |
| q05 | Cancelled, refund policy, offers a person |
| q06–q07 | Correct refusals; no order status, items or tracking returned |
| q08 | Correct reference normalisation, carrier, tracking and date |
| q09 | Partial: correct DPD tracking, omits expected date. Optional link appears as `URL_Redacted`, so it is not a usable tracking link |
| q10 | Partial: correctly says no tracking yet, omits dispatch window and expected date |
| q11 | Correct tracking context, then preview human-node entry after customer agrees |
| q12–q17 | Expected policy/certificate responses; policy is fictional and held in instructions |
| q18–q19 | Preview human-node entry; no quote invented and no extra attempt to answer q19 |
| q20 | Correctly declines off-topic request |

Thirteen lookup executions, eleven positive results and two negative. All 22 turns have traces.
The three `Escalate` responses have empty `targets`; there is no proof that a human received
anything. `execution-evidence.json` is the extracted execution record; the adjacent transcripts
and response JSONs are the conversation evidence.

For q17, the agent describes the certificate as emailed within the policy's five-working-day
window. The lookup confirms Issued, not an email timestamp. That wording should be made more
precise before presenting this as delivery evidence. Likewise, refund-policy language in q05 is
not proof that money moved. These are further reasons not to call this a production acceptance test.

## Next acceptance tests

Use fresh cases after changing policy wording or output requirements. Verify an activated version
and a real receiving queue separately. Test unavailable-human behaviour, customer isolation and
permission/tool failures. Do not score human receipt from `__human__` or from an evaluator label.
