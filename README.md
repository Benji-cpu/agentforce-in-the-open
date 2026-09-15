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

The demo business and its data are invented. They will say so everywhere they appear.

## Status

| | |
|---|---|
| Salesforce CLI | installed — `@salesforce/cli/2.146.3`, `agent` plugin 1.45.0 (core) |
| Developer Edition org | **not yet created** — signup blocked, see below |
| Agent metadata | not yet |
| Measured result | not yet |

## Reproducing this

```bash
npm install -g @salesforce/cli        # 714 packages, ~18s on Node 20.19.2
sf --version
sf plugins --core | grep '^agent'     # agent 1.45.0 (core) — no separate install needed
```

Then sign up for a free Developer Edition org at
<https://developer.salesforce.com/signup> (the one that includes Agentforce and Data 360),
and authorise it:

```bash
sf org login web --alias agentforce-de --set-default
sf org display --target-org agentforce-de
```

**Do the signup by hand.** Two things stop automation, both recorded in `docs/capture/`:

1. `www.salesforce.com` is behind Akamai, which serves a **headless** browser `403 Access
   Denied` and a headed one `200`. Nothing else about the request differs.
2. The form itself validates fine when driven, and then the submit hangs on *"Please
   wait.."* forever. An invisible reCAPTCHA is loaded on the page but never initialises,
   and no request is ever sent. It is a captcha doing its job, so it stays undefeated here.

## What is in this repo

```
docs/build-log.html      source of the published build log — republished, never rewritten
docs/capture/            evidence, captured at the moment it happened
docs/capture/manifest.json   what each file shows, and when
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
