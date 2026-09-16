# Did the support agent actually do the work?

A customer asks where an order is. The agent replies, “I am checking the status of your order.”
The answer sounds reasonable. In this test, no lookup happened.

I built a small Salesforce Agentforce prototype to investigate support tasks like this. Northaven
Instruments is a fictional shop; all orders, customers and policies are synthetic. This is a
Developer Edition experiment, not a client deployment.

## What failed

The agent's user was missing the permission set that grants access to the order-lookup Apex class.
In the captured preview, the lookup disappeared from the available tools. The conversation did
not expose a permissions error. The agent promised to check anyway.

After assigning the permission set, the same question called the lookup and returned the order's
status and tracking details. The before-and-after [conversation and tool list](capture/23-first-conversation.md)
show the difference. This is an observation from this org and CLI version, not a claim that every
Salesforce permissions failure behaves the same way.

## What I checked next

I ran twenty scripted conversations, each in a fresh session: order status, delivery, returns,
calibration paperwork and requests for a person. I compared the replies with the synthetic records
and inspected the execution traces. The first three rounds reused the same questions while I
changed the instructions. They are development checks, not an independent reliability benchmark.

The third round was scored as 17 acceptable replies, two preview escalation events and one
failure. “Acceptable” includes refusing a mismatched email or an off-topic question; it does not
mean seventeen support tickets were resolved. The failure was an offer to hand over a calibration
quote that did not execute an escalation.

Even the successful escalation events did not show a human receiving the conversation. The saved
responses have empty destination lists. A connected support channel and a receiving queue still
need their own test. Salesforce documents that routing separately in its
[Omni-Channel escalation guidance](https://help.salesforce.com/s/articleView?id=service.service_agent_escalation.htm&language=en_US&type=5).

## A practical acceptance check

For an order question, check that the correct record was read and that a mismatched customer gets
no details. For a handoff, check that the receiving team actually has the conversation and its
context. For an unavailable action, check that the agent explains the limitation and gives a real
fallback. A fluent answer, an evaluator's “resolved” label and a completed operation are separate
pieces of evidence.

The lookup here matches a supplied email and reference. That is not proof of identity. Real
customer data would require an agreed authentication and access design. Policies currently live
in instructions rather than Salesforce Knowledge. No cost saving or reduction in support volume
has been measured.

The current results and remaining work are in the [README](../README.md). The
[test questions](../tests/twenty-questions.json) and
[round-three execution evidence](capture/28-twenty-questions-round-3/execution-evidence.json)
are available to inspect without signing up.
