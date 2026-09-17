# Northaven demonstration: operator handover

Northaven is fictional. This org must only hold synthetic data for this demonstration.
The public page plays recorded examples; it does not expose the Salesforce org or accept messages.

## Operating the demonstration

Run every Salesforce command through `./sf` (isolated Node 22). The org alias is `agentforce-de`.
Use `./sf agent preview start --api-name Northaven_Support --target-org agentforce-de --json`
to start the activated version, then `agent preview send` / `end` with the same API name and session.
The script supports `PUBLISHED=1 node tools/preview.mjs run <cases.json> <new-capture-directory>`.
A capture directory must be new: the runner refuses to overwrite evidence.

## Policy ownership

The three published Salesforce Knowledge articles have URL names `northaven-returns`,
`northaven-calibration`, `northaven-delivery`. Their seed text is in `docs/policies/northaven.json`.
The Apex action only reads Online articles in en_US. It performs exact retrieval by topic, not
semantic search. To change a policy, edit and publish a new article version, update the seed text
and rerun the relevant tests. Do not silently change the instructions as a second policy source.
The seed script only creates missing published articles; it does not overwrite editorial changes.

## Reviewing support requests

In Salesforce, open Cases and choose the Northaven Support — Demo queue. The Case Description
contains the conversation summary; Supplied Email is the reply address. Case Number is returned
to the conversation. The queue includes the demo operator and agent via
`scripts/setup-support-queue.apex`. Notifications are deliberately disabled: no demo sends mail.
A record saved in this queue is not a claim that someone read it or a live-chat transfer occurred.

The action requires a reply email and issue summary. An identical email/summary on the same UTC
date reuses the existing Case; a unique request-key field prevents a duplicate insert race. A
paraphrased summary can still create a separate case. Real deployments should use a trusted
channel/session idempotency key and retention policy, not this demo's content/date key.
If the queue is missing or a write cannot be confirmed, the action reports failure and no
success message or case number should be invented. Tests cover these paths.

## Before adapting this for a customer

Agree identity verification and record access; knowing an email and order number is not login.
Use trusted channel context and cross-customer isolation tests. Wire up the intended messaging
channel, staffed queue, off-hours behaviour and notifications. Review privacy/retention and
monitoring. Use fresh test cases, failure injection and cost measurements before making a
service-level or financial claim. The demonstration is complete as a synthetic implementation;
these are acceptance requirements for a different deployment, not claims it has passed.

## Stop / rollback

`./sf agent deactivate --api-name Northaven_Support --target-org agentforce-de` stops new use of
the activated agent. Retain Cases and captures until inspected; do not delete them to clean a score.
Code and generated agent versions remain in git for inspection. Knowledge enablement is an org
setting and should not be treated as reversible deployment cleanup.

## Agent-user Knowledge permission

Object-level read permission on Knowledge is insufficient on its own. The Einstein Agent User
also needs the **Allow View Knowledge** app permission (`AllowViewKnowledge` in metadata). It is
included in `Northaven_Support_Access`. Do not assign a Knowledge User licence to the agent user.
The final test records preserve the pre-permission failure and the successful reruns.

## Published-agent trace limitation

On CLI 2.146.3 / agent plugin 1.45.0, published-agent sessions save under the bot id in `.sfdx/agents/`,
not under its API name. In this run the trace JSON files were empty objects. The evidence reporter
marks those incomplete; it does not infer execution from a response. The public examples use
traced authoring-bundle runs with live actions, plus separate activated-version conversations
and Case readbacks. This distinction must remain in future reports.

## Recreate the new pieces in a compatible demo org

After enabling Agentforce and creating the agent user as described in the README, deploy the
Knowledge setting, Case field and queue before the classes and permission sets:

```sh
./sf project deploy start --source-dir force-app/main/default/settings
./sf project deploy start --source-dir force-app/main/default/objects --source-dir force-app/main/default/queues
./sf project deploy start --source-dir force-app/main/default/classes
./sf project deploy start --source-dir force-app/main/default/permissionsets
./sf org assign permset --name Northaven_Support_Access
./sf org assign permset --name Northaven_Support_Access --on-behalf-of <agent-username>
node tools/seed-knowledge.mjs
./sf apex run --file .sf-tmp/seed-knowledge.apex
# Adapt the demo agent username in this script to your org before running.
./sf apex run --file scripts/setup-support-queue.apex
./sf agent publish authoring-bundle --api-name Northaven_Support
./sf agent activate --api-name Northaven_Support --version <published-version>
```

Review the permissions and script before running in a different org. The recorded acceptance
applies to the org used for this demonstration, not every possible Salesforce configuration.
