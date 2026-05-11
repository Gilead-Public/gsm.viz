---
name: incremental-implementation
description: Delivers changes incrementally via TDD. Use when implementing any feature or change that touches more than one file. Use when you're about to write a large amount of code at once, or when a task feels too big to land in one step.
---

# Incremental Implementation

## Overview

Build in thin vertical slices using TDD — for each slice, write a failing test first, implement the minimum code to pass, refactor, verify, and commit. Each increment leaves the system in a working, testable state.

## When to Use

- Implementing any multi-file change
- Building a new feature from a task breakdown
- Refactoring existing code
- Any time you're tempted to write more than ~100 lines before testing

## The TDD Increment Cycle

```
┌──────────────────────────────────────────────┐
│                                              │
│   RED ──→ GREEN ──→ REFACTOR ──→ VERIFY ──┐  │
│    ▲                                      │  │
│    └──────── Commit ◄─────────────────────┘  │
│              │                               │
│              ▼                               │
│          Next slice                          │
│                                              │
└──────────────────────────────────────────────┘
```

For each slice:

1. **RED** — Write a failing test that describes the expected behavior of this slice
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Clean up the implementation while keeping tests green
4. **VERIFY** — Run `npm test` and `npm run bundle` to confirm nothing is broken
5. **COMMIT** — Save your progress with a descriptive message
6. **Next slice** — Carry forward, don't restart

## Slicing Strategies

### Vertical Slices (Preferred)

For gsm.viz chart modules, a typical vertical slice sequence:

```
Slice 1: Data transformation function + tests
    → Tests pass, data transforms correctly

Slice 2: Chart.js configuration builder + tests
    → Tests pass, configuration generates correctly

Slice 3: React component wrapper + tests
    → Tests pass, component renders with mock data

Slice 4: Integration with example page
    → Tests pass, example works in browser
```

### Risk-First Slicing

Tackle the riskiest piece first:

```
Slice 1: Prove the Chart.js plugin integration works (highest risk)
Slice 2: Build the data pipeline on the proven integration
Slice 3: Add configuration options and edge cases
```

## Implementation Rules

### Rule 0: TDD Is Non-Negotiable

Every slice begins with a failing test. No exceptions.

```
✗ Write implementation → write test after → hope it catches bugs
✓ Write failing test → write minimum implementation → refactor
```

### Rule 1: Simplicity First

Before writing any code, ask: "What is the simplest thing that could work?"

```
SIMPLICITY CHECK:
✗ Generic chart factory for one chart type
✓ Straightforward module following existing patterns

✗ Abstract configuration builder with plugin system
✓ Direct configuration object matching Chart.js API
```

### Rule 2: Scope Discipline

Touch only what the task requires.

If you notice something worth improving outside your task scope, note it — don't fix it:

```
NOTICED BUT NOT TOUCHING:
- src/util/format.js has an unused import (unrelated to this task)
- The barChart module could use better error messages (separate task)
→ Want me to create tasks for these?
```

### Rule 3: One Thing at a Time

Each increment changes one logical thing. Don't mix concerns.

### Rule 4: Keep It Compilable

After each increment, the project must build (`npm run bundle`) and existing tests must pass (`npm test`).

## Increment Checklist

After each increment, verify:

- [ ] A failing test was written before implementation (Red)
- [ ] The test now passes with the implementation (Green)
- [ ] Code was refactored while tests stayed green
- [ ] All existing tests still pass: `npm test`
- [ ] The build succeeds: `npm run bundle`
- [ ] The change is committed with a descriptive message

## Common Rationalizations

| Rationalization                                    | Reality                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| "I'll test it all at the end"                      | Bugs compound. A bug in Slice 1 makes Slices 2-5 wrong. TDD each slice.                |
| "It's faster to do it all at once"                 | It _feels_ faster until something breaks and you can't find which change caused it.    |
| "The test is too simple to write first"            | Simple tests are fast to write. They document expected behavior and catch regressions. |
| "These changes are too small to commit separately" | Small commits are free. Large commits hide bugs.                                       |

## Red Flags

- Writing implementation code before a failing test exists
- More than 100 lines of code written without running tests
- Multiple unrelated changes in a single increment
- Build or tests broken between increments
- Touching files outside the task scope

## Verification

After completing all increments for a task:

- [ ] Each increment followed Red → Green → Refactor
- [ ] Each increment was individually tested and committed
- [ ] The full test suite passes: `npm test`
- [ ] The build is clean: `npm run bundle`
- [ ] The feature works as specified
- [ ] No uncommitted changes remain
