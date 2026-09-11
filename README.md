# ShopBot QA Home Assignment — Starter

Welcome! This starter repo contains a **mock support bot** and a skeleton
[promptfoo](https://www.promptfoo.dev/) setup. Your task is to write test cases
and assertions that catch where the bot misbehaves.

- **`ASSIGNMENT.md`** — what to do, deliverables, and how you'll be evaluated. Start here.
- **`SPEC.md`** — the contract the bot is *supposed* to follow (tone, fields, refusal/escalation rules, supported languages).
- **`mockProvider.js`** — the mock bot. No API key needed. It returns a JSON string per turn.
- **`promptfooconfig.yaml`** — provider is already wired up; add your tests here.

## Prerequisites

- Node.js 20+ and npm.
- No API key is required, and no network access is needed once installed.

## Setup

```bash
npm install
```

> **Heads-up before you start the clock:** promptfoo is a large dependency. The
> first install pulls ~470 packages and around **1.3 GB** onto disk, and takes a
> few minutes on a good connection. Several packages run install scripts. None
> of that is part of the exercise — get it out of the way first, and don't count
> it against your two hours.

## Run the tests

```bash
npm run eval      # run the suite (wraps: promptfoo eval)
npm run view      # open the results viewer in your browser
```

You can also call promptfoo directly, e.g. `npx promptfoo eval` and
`npx promptfoo view`.

## How the provider works

The prompt sent to the bot is just the customer's message, taken from the
`query` variable in each test case. The bot replies with a **JSON string**, so
your assertions run against that raw string. For example:

```yaml
tests:
  - vars:
      query: 'What is the status of order A1043?'
    assert:
      - type: is-json
      - type: javascript
        value: JSON.parse(output).intent === 'order_status'
```

See `SPEC.md` for the full response contract, the intent list, the card shapes,
and the sample order/product data you can reference in your tests.

Note that `estimatedDelivery` dates are generated relative to the day you run
the suite, so assert the *relationship* the spec describes (past vs. future),
not a literal date string.

**Remember:** your assertions should encode what `SPEC.md` requires, so a test
that fails is a bug you've found. A fully green run is not the goal — see the
ground rules in `ASSIGNMENT.md`.

## Submitting

Follow the **Deliverables** section in `ASSIGNMENT.md`. Please do **not** commit
`node_modules/` (a `.gitignore` is included). Add your own `README.md` notes
(bugs found, how to run, assumptions) as described in the assignment, either by
extending this file or adding a separate one.


I used Claude throughout this assignment — to get promptfoo installed on
Windows, to understand how promptfoo test cases are structured, and to help
write the assertions.

Two things I corrected. Claude gave me a negated regex assertion for the tone
check and the leading `!` was dropped, which would have inverted the logic — the
test would have passed when the bot *did* blame the customer. It also handed me
a YAML block with the wrong indentation, which crashed the parser. Both were
quick fixes, but the first one is the dangerous kind: a broken assertion that
goes green looks identical to a passing test.

I checked each reported bug against `mockProvider.js` myself rather than
trusting the red mark, so I could explain why each test fails.