---
name: planning-and-task-breakdown
description: Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
---

# Planning and Task Breakdown

## Overview

Decompose work into small, verifiable tasks with explicit acceptance criteria. Every task should be small enough to implement via TDD (write a failing test, make it pass, refactor) in a single focused session.

## When to Use

- You have a spec and need to break it into implementable units
- A task feels too large or vague to start
- The implementation order isn't obvious

**When NOT to use:** Single-file changes with obvious scope, or when the spec already contains well-defined tasks.

## The Planning Process

### Step 1: Enter Plan Mode

Before writing any code, operate in read-only mode:

- Read the spec and relevant codebase sections
- Identify existing patterns and conventions in `src/`
- Map dependencies between components
- Note risks and unknowns

**Do NOT write code during planning.**

### Step 2: Identify the Dependency Graph

Map what depends on what. In gsm.viz, typical dependencies:

```
Data utilities (src/data/)
    │
    ├── Chart module logic
    │       │
    │       └── React component (JSX)
    │               │
    │               └── Example page (examples/)
    │
    └── Shared utilities (src/util/)
```

### Step 3: Slice Vertically

Build one complete feature path at a time:

**Good (vertical slicing):**

```
Task 1: Data transform function + tests
Task 2: Chart configuration + tests
Task 3: React component wrapper + tests
Task 4: Example page integration
```

Each vertical slice delivers working, testable functionality.

### Step 4: Write Tasks

Each task follows this structure:

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**TDD approach:**

- Red: Write failing test(s) for [specific behavior]
- Green: Implement minimum code to pass
- Refactor: Clean up while tests stay green

**Acceptance criteria:**

- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]
- [ ] Failing test written before implementation
- [ ] All tests pass: `npm test`

**Dependencies:** [Task numbers this depends on, or "None"]

**Files likely touched:**

- `src/path/to/module.js`
- `tests/path/to/test.js`

**Estimated scope:** [Small: 1-2 files | Medium: 3-5 files | Large: 5+ files]
```

### Step 5: Order and Checkpoint

Arrange tasks so that:

1. Dependencies are satisfied (build foundation first)
2. Each task leaves the system in a working state
3. Verification checkpoints occur after every 2-3 tasks
4. High-risk tasks are early (fail fast)

## Task Sizing Guidelines

| Size   | Files | Example                               |
| ------ | ----- | ------------------------------------- |
| **XS** | 1     | Add a validation rule                 |
| **S**  | 1-2   | Add a new utility function            |
| **M**  | 3-5   | Add a new chart configuration option  |
| **L**  | 5-8   | New chart type module                 |
| **XL** | 8+    | **Too large — break it down further** |

## Common Rationalizations

| Rationalization              | Reality                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| "I'll figure it out as I go" | That's how you end up with rework. 10 minutes of planning saves hours. |
| "The tasks are obvious"      | Write them down anyway. Explicit tasks surface hidden dependencies.    |
| "Planning is overhead"       | Planning is the task. Implementation without a plan is just typing.    |

## Verification

Before starting implementation, confirm:

- [ ] Every task has acceptance criteria
- [ ] Every task specifies the TDD approach (what test to write first)
- [ ] Every task has a verification step
- [ ] Task dependencies are identified and ordered correctly
- [ ] No task touches more than ~5 files
- [ ] Checkpoints exist between major phases
