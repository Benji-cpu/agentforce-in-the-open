# Agentforce in the Open

Can a support agent look up an order, refuse an incorrect email and ask for human help without
claiming to have done work it never performed?

This repository is my first Agentforce prototype, built in a Salesforce Developer Edition org.
**Northaven Instruments is fictional. Every customer, order and policy is synthetic.** I have
Salesforce architecture experience; this project is not evidence of a production Agentforce rollout.

**[Explore the finished demonstration](https://benji-cpu.github.io/agentforce-in-the-open/)** — recorded conversations with the action evidence beside each reply.

## Current implementation — 17 September 2026

Northaven Support v3 is published and activated in the synthetic Developer Edition org. Three
Apex actions look up orders, retrieve published Salesforce Knowledge articles and save support
requests to a Case queue. The public page is a recorded replay, not a live customer channel.

- Nine named Apex test methods passed. The test run reported 97% coverage.
- Twenty development scenarios and five additional held-out scenarios were exercised against
  the published agent. Failures and targeted reruns are preserved in [the acceptance report](docs/ACCEPTANCE.md).
- Support receipt is checked by reading saved Cases, including their owner and context.
  This proves persistence in a queue, not human attention, live transfer or email delivery.
- Public examples use authoring-bundle traces with live actions. Published-version responses
  were tested separately; this CLI returned empty traces for those sessions.
- Email/reference matching is a demo gate, **not authentication**. No customer outcomes,
  production reliability, deflection rate or financial return have been measured.

[Architecture](docs/implementation.md) · [Operator handover](docs/HANDOVER.md) ·
[Acceptance evidence](docs/ACCEPTANCE.md) · [Original failure](docs/what-the-agent-actually-did.md)

The original [build log](docs/build-log.html) and [review](docs/review-2026-09-16.md) remain as dated
history. This page supersedes the old hosted Claude artifact for current status.

## Correction to the original measurement

The earlier “33 of 33 lookup turns” claim was incorrect. Re-reading the saved traces found
**12, 13 and 13 lookup calls** in rounds one, two and three: 38 in total, including six negative
lookups. Round-one question 2 never called the lookup. The three exported `execution-evidence.json`
files preserve that audit. A claim to have escalated when no escalation occurred is also a false
statement; the old “no wrong facts” wording has been withdrawn.

## Reproducing this

```bash
npm install -g @salesforce/cli        # 714 packages, ~18s
./sf --version                        # NOT bare `sf` — see the Node note below
./sf plugins --core | grep '^agent'   # agent 1.45.0 (core) — no separate install needed
```

**The Node note.** The CLI installs cleanly on Node 20 and then crashes on it: its bundled
undici calls `webidl.util.markAsUncloneable`, which arrived in Node 22.

```
TypeError: webidl.util.markAsUncloneable is not a function
```

`./sf` in this repo is three lines that put a keg-only node@22 on PATH for that one command
and leave the machine default alone. If you are on Node 22 already, bare `sf` is fine.

Then sign up for a free Developer Edition org at
<https://developer.salesforce.com/signup> (the one that includes Agentforce and Data 360)
and authorise it:

```bash
./sf org login web --alias agentforce-de --set-default
./sf org display --target-org agentforce-de
```

**Do the signup by hand.** Two things stop automation, both recorded in `docs/capture/`:
`www.salesforce.com` is behind Akamai, which serves a **headless** browser `403 Access
Denied` and a headed one `200`; and the form itself validates when driven and then hangs on
*"Please wait.."* forever, because an invisible reCAPTCHA never initialises and no request is
ever sent. It is a captcha doing its job, so it stays undefeated here.

### Then turn Agentforce on, because it is off

A Developer Edition org signed up *for Agentforce* arrives with Agentforce switched off.
The CLI's way of telling you is:

```
Error (1): This feature is not currently enabled for this user type or org: [AgentforceAiAssist]
```

The switch is **Setup → Einstein → Agentforce Studio → Agentforce Agents**, a single toggle
reading Off. Three things that look like the answer and are not: Einstein Setup says "Turn on
Einstein: On" and means something else; `sf org list metadata-types` lists `GenAiPlannerBundle`,
`GenAiPlugin` and `GenAiFunction` as though the feature were live; and `BotDefinition` is not a
queryable sObject, which reads like a permissions problem.

**That toggle has no metadata representation.** It cannot be deployed, committed, or handed
over as source — so it belongs in a runbook. `docs/capture/14-agentforce-toggle.txt` is that
runbook entry.

### Building the agent

```bash
./sf agent generate agent-spec --type customer --company-name "..." --max-topics 4 \
  --output-file specs/northaven-agent-spec.yaml
./sf agent generate authoring-bundle --spec specs/northaven-agent-spec.yaml \
  --name "Northaven Support" --api-name Northaven_Support
./sf agent validate authoring-bundle --api-name Northaven_Support
```

The generated bundle compiles and does nothing; the real one is what is in `force-app/` now.

### Deploying this repo into your own org

The order matters, and each step below is there because the obvious order failed
(`docs/capture/19-deploy-fields-apex-permset.txt` has the failures).

```bash
# 1. Fields first, on their own. Tests run in the same deployment cannot see new fields.
./sf project deploy start --source-dir force-app/main/default/objects

# 2. Then the Apex, without tests, so the permission set that references the class can deploy.
./sf project deploy start --source-dir force-app/main/default/classes
./sf project deploy start --source-dir force-app/main/default/permissionsets

# 3. A metadata deploy grants NO field-level security to the user who ran it.
#    Give yourself edit on the new fields, or the data load silently writes nothing into them.
./sf org assign permset --name Northaven_Data_Loader --on-behalf-of <your username>

# 4. Now the tests pass.
./sf apex run test --tests NorthavenOrderLookupTest --synchronous --code-coverage

# 5. The Einstein Agent User the service agent runs as. Profile 'Einstein Agent User' exists
#    in the org already; the user does not.
./sf data create record --sobject User --values "Username=northaven_support_agent@<orgId>.ext \
  LastName='Northaven Support Agent' Email=<you> Alias=nhagent TimeZoneSidKey=Europe/London \
  LocaleSidKey=en_GB EmailEncodingKey=UTF-8 LanguageLocaleKey=en_US ProfileId=<that profile's Id>"
./sf org assign permset --name AgentforceServiceAgentUser --on-behalf-of northaven_support_agent@<orgId>.ext
./sf org assign permset --name Northaven_Support_Access   --on-behalf-of northaven_support_agent@<orgId>.ext
#    Its licence refuses "View All" on Order and Account, so the permission set does not ask for it.

# 6. The dataset, then the agent.
./sf data import tree --plan data/northaven/plan.json
./sf project deploy start --source-dir force-app/main/default/aiAuthoringBundles
```

Set `access.default_agent_user` in the `.agent` file to the username you created.

**If the agent promises a lookup but does not execute it, check step 5 and the trace.** In this
org, missing Apex access removed the lookup from the offered tools without a conversation-level
permissions error. Other failures can produce similar symptoms; inspect the actual tool list
before diagnosing the cause (`docs/capture/23-first-conversation.md`).

### Talking to it, and measuring it

`sf agent preview` is interactive. `tools/preview.mjs` drives its `start` / `send` / `end`
subcommands so a conversation can be scripted and saved:

```bash
node tools/preview.mjs start                          # live actions; --simulate to mock them
node tools/preview.mjs send <session> "Where is NI-2041? p.raman@whitcombe-academy.example"
node tools/preview.mjs end <session>

node tools/preview.mjs run tests/twenty-questions.json docs/capture/<run-dir>   # the measurement
node tools/score-traces.mjs docs/capture/<run-dir> --export # synthetic execution evidence
```

`tests/twenty-questions.json` is the twenty: one fresh session per case, the expected outcome
and what "correct" means written next to each. The CLI writes a trace per turn under
`.sfdx/agents/`; the scorer reads them and prints which subagent handled the turn, whether the
lookup ran and what it returned, whether the escalation fired, and the org's own guardrail
verdict — which is worth having, because it marked an escalation that never happened as
FULLY_RESOLVED.

Scores are read by a person against the transcript, not by the model. `SCORE.md` in each run
directory is that reading.

Note `agent create` exists and the CLI's own help tells you not to use it: the recommended
path is the `agent generate|validate|publish authoring-bundle` trio, which produces **Agent
Script** — a readable blueprint file, in the repo, that can be diffed and deployed. Several
walkthroughs still teach the older route.

## What is in this repo

```
sf                                three lines that run the CLI on node@22
sfdx-project.json                 the repo root IS the SFDX project
specs/northaven-agent-spec.yaml   what the agent is for, and its four topics
force-app/…/aiAuthoringBundles/   the Agent Script blueprint — the thing to read
force-app/…/classes/              order lookup, Knowledge retrieval, support request + tests
force-app/…/objects/Order/fields/ seven custom fields the lookup reads
force-app/…/permissionsets/       what the agent user may touch; what a data loader needs
force-app/…/bots/, genAiPlannerBundles/   what `sf agent publish` compiled the blueprint into
data/northaven/                   the synthetic dataset, and a README saying so
tests/twenty-questions.json       the measurement
tools/preview.mjs                 scripted conversations through sf agent preview
tools/score-traces.mjs            reads the traces back
docs/build-log.html               source of the published build log — republished, never rewritten
docs/capture/                     evidence, captured at the moment it happened
docs/capture/manifest.json        what each file shows, and when
```

`docs/capture/` is the part that cannot be retrofitted. A screenshot of a screen you
already closed does not exist, and an error you already fixed cannot be recalled
accurately. Everything in there was written as it happened.

## What you will and will not find here

- **Reviewed synthetic evidence is public**: selected config, prompts, measurements and
  failures. Credentials, tokens, session secrets and personal account details must stay private.
- **Nothing from a real client** without their permission in writing — not the name, not
  the data, not a screenshot, not the industry if it identifies them.
- **No number that was not measured**, and no demo implying production experience I do not
  have.

## Licence

MIT for anything in this repo that is code. The write-ups are mine; quote them freely with
a link.
