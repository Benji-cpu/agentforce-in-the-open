My support agent told a customer it was checking their order. No lookup had happened.

I was building an Agentforce demo for a fictional lab-supplies shop. The agent’s user was missing permission to run the lookup. The tool disappeared from the model’s options, but the reply still said it was checking.

The conversation sounded fine. The execution trace showed the problem.

I’ve now finished the demonstration around that distinction: the agent looks up orders, reads published Knowledge articles and saves support requests to a Salesforce queue. A request gets a case number only after the record exists.

You can explore the recorded conversations with the evidence beside each answer. The source and test results are there too, including what still needs work before a customer rollout.

This brings together my Salesforce architecture background and the AI-agent work I’ve been doing since. The question I keep coming back to is simple: what would the next person need to see to trust that the job was done?

The finished build: https://benji-cpu.github.io/agentforce-in-the-open/
