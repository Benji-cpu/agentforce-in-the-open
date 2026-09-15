# Agentforce in the Open

Building a first Agentforce agent from zero, in public, with the failures left in.

I am a Salesforce architect: eight active certifications, four of them architect-level
(Application Architect, Integration Architect, Data Architect, Sharing and Visibility
Architect), four years as the application architect at a London fintech. I have not been
inside a Salesforce org since 2023, and I have never shipped an Agentforce agent.

The two years since have gone on AI agents outside the Salesforce world — production
agents, MCP servers, the plumbing underneath them. This repo is the join between those two
things, written down while it happens rather than after it worked.

**Build log:** [Agentforce in the Open](https://claude.ai/artifact/MyQNgZ69x8jHkgh2bUNHVi)
— one entry per working session: what I set out to do, what actually happened, the number,
what broke, what is next.

## What is being built

A service agent for a small business that:

- answers the three most repetitive support questions, grounded in knowledge articles
- takes **one real action** — looks something up, or opens a case; not a chatbot demo
- escalates cleanly to a human when it does not know
- is defined as **metadata**, deployable from this repo with `sf project deploy start`

and then gets **measured**: twenty realistic questions, scored as answered / escalated /
answered wrong. That last count is the headline, and it is the number almost no Agentforce
demo publishes.

## Status

| | |
|---|---|
| Salesforce CLI | installed — `@salesforce/cli/2.146.3`, `agent` plugin 1.45.0 (core). Run it through `./sf`, not bare `sf` — see below |
| Developer Edition org | **live**, authorised, Agentforce toggled on |
| Agent blueprint | **scaffolded** — Agent Script at `force-app/main/default/aiAuthoringBundles/Northaven_Support/`, compiles with 0 errors |
| Agent instructions | boilerplate. 3 of 4 business subagents still say "help the user track their order" |
| One real action | not yet |
| Synthetic dataset | not yet |
| Measured result | not yet |

The demo business, **Northaven Instruments**, is a fictional small British lab-supplies
shop. It does not exist. Everything the agent appears to know about it was invented for
this build, and it will say so wherever it appears.

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

Note `agent create` exists and the CLI's own help tells you not to use it: the recommended
path is the `agent generate|validate|publish authoring-bundle` trio, which produces **Agent
Script** — a readable blueprint file, in the repo, that can be diffed and deployed. Several
walkthroughs still teach the older route.

## What is in this repo

```
sf                                three lines that run the CLI on node@22
sfdx-project.json                 the repo root IS the SFDX project
specs/northaven-agent-spec.yaml   what the agent is for, and its four topics
force-app/…/aiAuthoringBundles/   the Agent Script blueprint
docs/build-log.html               source of the published build log — republished, never rewritten
docs/capture/                     evidence, captured at the moment it happened
docs/capture/manifest.json        what each file shows, and when
```

`docs/capture/` is the part that cannot be retrofitted. A screenshot of a screen you
already closed does not exist, and an error you already fixed cannot be recalled
accurately. Everything in there was written as it happened.

## What you will and will not find here

- **Everything from the Developer Edition org is public**: the config, the prompts, the
  measured numbers, the costs, the mistakes. It is my own sandbox and there is nobody in it
  to protect.
- **Nothing from a real client** without their permission in writing — not the name, not
  the data, not a screenshot, not the industry if it identifies them.
- **No number that was not measured**, and no demo implying production experience I do not
  have.

## Licence

MIT for anything in this repo that is code. The write-ups are mine; quote them freely with
a link.
