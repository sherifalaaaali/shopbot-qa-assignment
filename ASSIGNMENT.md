# QA Home Assignment — Prompt Regression Testing with Promptfoo

**Estimated time:** ~2 hours for the Core section, plus as much of the Stretch
section as you want to attempt.
**Tool:** [promptfoo](https://github.com/promptfoo/promptfoo) (no LLM API key required — you'll test against a local mock provider)

## Scenario
We're building a support-bot feature. You're given a small **mock LLM provider**
(a local script that simulates the bot's responses). It does not always follow
its own spec. Your job is to use promptfoo to find where it goes wrong and to
prove it with tests.

## What we provide
- A starter repo with:
  - `mockProvider.js` — simulates the support bot (no API key needed)
  - `promptfooconfig.yaml` — skeleton config with the provider already wired up
  - A short spec (`SPEC.md`) describing what the bot *should* do (tone, refusal cases, escalation rules, and the expected response fields)

The bot returns a **structured JSON** response on every turn: a text `reply` plus
optional rich content (an order or product **card**) and metadata fields.
`SPEC.md` defines the exact contract.

## Two important ground rules

**1. Your test run is supposed to be RED.** Write assertions that encode the
behaviour `SPEC.md` *requires*, not the behaviour you *observe*. A failing test
is how you report a bug in this exercise. A suite where everything passes tells
us you've described the bot, not tested it. We expect failures — the useful
question is whether each one fails for the right reason.

**2. AI tools are allowed and expected.** Use whatever you'd use on the job.
We only ask that you add a short note in your README saying how you used them
and anywhere you disagreed with or corrected their output. We're interested in
your judgement, not in whether you typed every character.

## Core — please complete this part (~2 hours)

1. **Explore the baseline** — run `npx promptfoo eval` and `npx promptfoo view`
   to see current behavior.
2. **Write test cases** covering:
   - Happy path scenarios
   - Edge cases (empty input, very long input, unsupported language, etc.)
   - At least one adversarial/off-spec case
3. **Write assertions** for each test case using at least three different
   assertion types (e.g., `contains`, `regex`, `javascript`, `is-json`). Note:
   `llm-rubric` and other model-graded assertions require an API key and are
   **optional** — the deterministic assertion types above are sufficient.
4. **Find and report the spec violations** — there is more than one, and we
   haven't told you how many. For each: what's broken, which spec rule it
   breaks, and which of your test cases catches it.

## Stretch — optional, attempt what you find interesting

Tell us how far you got and why you stopped. Stopping deliberately with a reason
reads better than half-finishing everything.

- Go deeper on coverage. There are spec violations beyond the obvious ones, and
  some of them show up only for particular inputs.
- Where several different customer messages produce the same *kind* of wrong
  behaviour, say so — we'd rather read one well-argued issue with four examples
  than four separate tickets.
- Point out anywhere `SPEC.md` itself is ambiguous, untestable, or contradicts
  itself. Disagreeing with the spec is a legitimate finding.
- Sketch how you'd organise this suite if it had to run in CI on every change,
  and what you'd do differently if the provider were a real LLM whose output
  varied between runs.

## Deliverables
- The repo (zip or Git link) with your `promptfooconfig.yaml` and any added files
- A short `README.md` with:
  - How to run your tests
  - A summary of the spec violations you found, each mapped to the rule it breaks
  - How you used AI tools, if you did
  - Any assumptions you made

## Evaluation criteria
- Coverage: do the test cases reflect real-world usage, not just the obvious cases?
- Assertion quality: are checks specific and meaningful, not just "does it run"?
  Does each one fail for the right reason?
- Bug-finding: what did you catch, and did you prove it with a test rather than
  only describing it?
- Communication: is the README clear enough for a teammate to pick up your work?

## Getting started
See `README.md` for setup and run instructions, and `SPEC.md` for exactly how
the bot is supposed to behave. Submit your work per the **Deliverables** section
above.
