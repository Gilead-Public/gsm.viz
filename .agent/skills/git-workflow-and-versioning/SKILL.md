---
name: git-workflow-and-versioning
description: Structures git workflow practices. Use when making any code change. Use when committing, branching, or when you need to organize work.
---

# Git Workflow and Versioning

## Overview

Git is your safety net. Treat commits as save points, branches as sandboxes, and history as documentation. With TDD, each Red → Green → Refactor cycle produces a natural commit point.

## When to Use

Always. Every code change flows through git.

## Core Principles

### 1. Commit After Each TDD Cycle

Each successful Red → Green → Refactor cycle gets its own commit:

```
Write failing test (Red)
    → Make it pass (Green)
        → Refactor
            → npm test passes
                → Commit → Next cycle
```

### 2. Atomic Commits

Each commit does one logical thing:

```
# Good: Each commit is self-contained
a1b2c3d test: add failing test for metric calculation edge case
d4e5f6g feat: handle empty data arrays in calculateMetric
h7i8j9k refactor: extract threshold logic to utility function
m1n2o3p test: add regression test for tooltip bug #42

# Bad: Everything mixed together
x1y2z3a Add feature, fix sidebar, update deps, refactor utils
```

### 3. Descriptive Messages

```
<type>: <short description>

<optional body explaining why, not what>
```

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code change that doesn't fix a bug or add a feature
- `test` — Adding or updating tests
- `docs` — Documentation only
- `chore` — Tooling, dependencies, config

### 4. Keep Concerns Separate

Don't combine formatting changes with behavior changes:

```
# Good: Separate concerns
git commit -m "refactor: extract data transform to shared utility"
git commit -m "feat: add confidence interval to scatter plot"

# Bad: Mixed concerns
git commit -m "refactor and add confidence interval"
```

### 5. Size Your Changes

```
~100 lines  → Easy to review, easy to revert
~300 lines  → Acceptable for a single logical change
~1000 lines → Split into smaller changes
```

## Branching Strategy

```
main (always deployable)
  │
  ├── feature/new-chart-type    ← One feature per branch
  ├── feature/tooltip-redesign  ← Parallel work
  └── fix/scatter-plot-crash    ← Bug fixes
```

- Branch from `main`
- Keep branches short-lived (merge within 1-3 days)
- Delete branches after merge

### Branch Naming

```
feature/<short-description>   → feature/box-plot-module
fix/<short-description>       → fix/bar-chart-null-data
chore/<short-description>     → chore/update-chartjs
refactor/<short-description>  → refactor/data-pipeline
```

## The TDD Save Point Pattern

```
Agent starts work
    │
    ├── Writes failing test (Red)
    │   ├── Implements code (Green) → Refactors → Tests pass? → Commit
    │   └── Tests fail unexpectedly? → git reset --hard HEAD → Investigate
    │
    ├── Writes next failing test (Red)
    │   ├── Implements → Green → Refactor → Commit
    │   └── Tests fail? → Revert to last commit → Investigate
    │
    └── Feature complete → Clean history of TDD cycles
```

## Pre-Commit Hygiene

Before every commit:

```bash
# 1. Check what you're about to commit
git diff --staged

# 2. Run tests
npm test

# 3. Verify build
npm run bundle

# 4. Ensure no secrets
git diff --staged | grep -i "password\|secret\|api_key\|token"
```

## Change Summaries

After any modification, provide a structured summary:

```
CHANGES MADE:
- src/scatterPlot/config.js: Added threshold line support
- tests/scatterPlot.test.js: Added TDD tests for threshold line

THINGS I DIDN'T TOUCH (intentionally):
- src/barChart/: Has similar gap but out of scope
- src/util/colors.js: Could use refactoring (separate task)

TDD EVIDENCE:
- Failing tests written before implementation
- All tests pass: npm test
- Build succeeds: npm run bundle
```

## Common Rationalizations

| Rationalization                        | Reality                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| "I'll commit when the feature is done" | One giant commit is impossible to review or revert. Commit each TDD cycle.   |
| "The message doesn't matter"           | Messages are documentation. Future you will need to understand what changed. |
| "I'll squash it all later"             | Squashing destroys the TDD narrative. Prefer clean incremental commits.      |

## Red Flags

- Large uncommitted changes accumulating
- Commit messages like "fix", "update", "misc"
- No evidence of TDD in commit history (no test commits before implementation commits)
- Formatting changes mixed with behavior changes
- Committing `node_modules/`, `.env`, or build artifacts

## Verification

For every commit:

- [ ] Commit does one logical thing
- [ ] Message explains the why, follows type conventions
- [ ] Tests pass before committing: `npm test`
- [ ] Build succeeds: `npm run bundle`
- [ ] No secrets in the diff
- [ ] `.gitignore` covers standard exclusions
