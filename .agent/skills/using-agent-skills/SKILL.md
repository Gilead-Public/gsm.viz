---
name: using-agent-skills
description: Discovers and invokes agent skills. Use when starting a session or when you need to discover which skill applies to the current task. This is the meta-skill that governs how all other skills are discovered and invoked.
---

# Using Agent Skills

## Overview

Agent Skills is a collection of engineering workflow skills organized by development phase. Each skill encodes a specific process that senior engineers follow. This meta-skill helps you discover and apply the right skill for your current task.

## Project Context: gsm.viz

This is a React 18 / Chart.js 3 / D3 7 data visualization library for clinical trial risk-based monitoring, built by Gilead BioStats. Key facts:

- **Language:** JavaScript (ES modules, JSX)
- **Build:** esbuild
- **Test:** Jest with jsdom + jest-canvas-mock
- **Formatting:** Prettier (single quotes, tab width 4)
- **Source:** `src/` (modules: barChart, scatterPlot, timeSeries, sparkline, groupOverview, plus data/ and util/)
- **Tests:** `tests/`
- **Examples:** `examples/`

## Mandatory Development Rule: TDD

All code changes in this project MUST follow Red/Green/Refactor test-driven development:

1. **Red** — Write a failing test that describes the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up the implementation while keeping tests green

No implementation code without a corresponding test. Tests are evidence — "it works" is not sufficient; a passing test suite is required. This applies to all skills, not just when `test-driven-development` is explicitly invoked.

## Skill Discovery

When a task arrives, identify the development phase and apply the corresponding skill:

```
Task arrives
    │
    ├── New project/feature/change? ──→ spec-driven-development
    ├── Have a spec, need tasks? ──────→ planning-and-task-breakdown
    ├── Implementing code? ────────────→ incremental-implementation
    │   └── UI work? ─────────────────→ frontend-ui-engineering
    ├── Writing/running tests? ────────→ test-driven-development
    ├── Something broke? ──────────────→ debugging-and-error-recovery
    ├── Reviewing code? ───────────────→ code-review-and-quality
    └── Committing/branching? ─────────→ git-workflow-and-versioning
```

## Core Operating Behaviors

These behaviors apply at all times, across all skills. They are non-negotiable.

### 1. Surface Assumptions

Before implementing anything non-trivial, explicitly state your assumptions:

```
ASSUMPTIONS I'M MAKING:
1. [assumption about requirements]
2. [assumption about architecture]
3. [assumption about scope]
→ Correct me now or I'll proceed with these.
```

### 2. Manage Confusion Actively

When you encounter inconsistencies, conflicting requirements, or unclear specifications:

1. **STOP.** Do not proceed with a guess.
2. Name the specific confusion.
3. Present the tradeoff or ask the clarifying question.
4. Wait for resolution before continuing.

### 3. Push Back When Warranted

You are not a yes-machine. When an approach has clear problems:

- Point out the issue directly
- Explain the concrete downside (quantify when possible)
- Propose an alternative
- Accept the human's decision if they override with full information

### 4. Enforce Simplicity

Before finishing any implementation, ask:

- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a staff engineer look at this and say "why didn't you just..."?

### 5. Maintain Scope Discipline

Touch only what you're asked to touch.

Do NOT:

- Remove comments you don't understand
- "Clean up" code orthogonal to the task
- Refactor adjacent systems as a side effect
- Delete code that seems unused without explicit approval
- Add features not in the spec

### 6. Verify, Don't Assume

Every skill includes a verification step. A task is not complete until verification passes. "Seems right" is never sufficient — there must be evidence (passing tests, build output, runtime data).

## Failure Modes to Avoid

1. Making wrong assumptions without checking
2. Not managing your own confusion — plowing ahead when lost
3. Not surfacing inconsistencies you notice
4. Not presenting tradeoffs on non-obvious decisions
5. Being sycophantic ("Of course!") to approaches with clear problems
6. Overcomplicating code and APIs
7. Modifying code or comments orthogonal to the task
8. Removing things you don't fully understand
9. Building without a spec because "it's obvious"
10. Skipping verification because "it looks right"
11. Writing implementation code before writing a failing test

## Skill Rules

1. **Check for an applicable skill before starting work.**
2. **Skills are workflows, not suggestions.** Follow the steps in order.
3. **Multiple skills can apply.** A feature might involve `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `test-driven-development` → `code-review-and-quality` in sequence.
4. **When in doubt, start with a spec.** If the task is non-trivial and there's no spec, begin with `spec-driven-development`.
5. **TDD is always active.** Every skill that produces code must follow Red → Green → Refactor.

## Lifecycle Sequence

For a complete feature, the typical skill sequence is:

```
1.  spec-driven-development     → Define what we're building
2.  planning-and-task-breakdown → Break into verifiable chunks
3.  incremental-implementation  → Build slice by slice (TDD per slice)
4.  test-driven-development     → Prove each slice works
5.  code-review-and-quality     → Review before merge
6.  git-workflow-and-versioning → Clean commit history
```

Not every task needs every skill. A bug fix might only need: `debugging-and-error-recovery` → `test-driven-development` → `code-review-and-quality`.

## Quick Reference

| Phase  | Skill                        | One-Line Summary                                 |
| ------ | ---------------------------- | ------------------------------------------------ |
| Define | spec-driven-development      | Requirements and acceptance criteria before code |
| Plan   | planning-and-task-breakdown  | Decompose into small, verifiable tasks           |
| Build  | incremental-implementation   | Thin vertical slices, TDD each before expanding  |
| Build  | frontend-ui-engineering      | Production-quality UI with accessibility         |
| Verify | test-driven-development      | Failing test first, then make it pass            |
| Verify | debugging-and-error-recovery | Reproduce → localize → fix → guard               |
| Review | code-review-and-quality      | Five-axis review with quality gates              |
| Ship   | git-workflow-and-versioning  | Atomic commits, clean history                    |
