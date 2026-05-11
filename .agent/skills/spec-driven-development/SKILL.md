---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. Code without a spec is guessing.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- You're about to make an architectural decision
- The task would take more than 30 minutes to implement

**When NOT to use:** Single-line fixes, typo corrections, or changes where requirements are unambiguous and self-contained.

## The Gated Workflow

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT (TDD)
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

### Phase 1: Specify

Start with a high-level vision. Ask the human clarifying questions until requirements are concrete.

**Surface assumptions immediately:**

```
ASSUMPTIONS I'M MAKING:
1. This is a new chart type built on Chart.js
2. Tests will use Jest with jsdom + jest-canvas-mock
3. The module follows existing src/ directory conventions
4. We're targeting modern browsers only
→ Correct me now or I'll proceed with these.
```

**Write a spec document covering these six core areas:**

1. **Objective** — What are we building and why? Who is the user? What does success look like?

2. **Commands** — Full executable commands:

   ```
   Build: npm run build
   Bundle: npm run bundle
   Test: npm test (or jest)
   Test with coverage: npm run test:coverage
   Format: npm run format
   Dev: npm run local
   ```

3. **Project Structure** — Where source code lives, where tests go:

   ```
   src/           → Source modules (barChart, scatterPlot, timeSeries, etc.)
   src/data/      → Data handling utilities
   src/util/      → Shared utilities
   tests/         → Jest test files
   examples/      → Example HTML pages and data
   ```

4. **Code Style** — Prettier with single quotes, tab width 4. ES module syntax.

5. **Testing Strategy** — Jest with jsdom environment and jest-canvas-mock. TDD required: write failing test first, then implement. Test pyramid: 80% unit, 15% integration, 5% E2E.

6. **Boundaries** — Three-tier system:
   - **Always do:** Write failing test before implementation, run `npm test` before commits, follow existing module patterns
   - **Ask first:** Adding new dependencies, changing build config, modifying shared utilities
   - **Never do:** Commit secrets, edit bundled output (`index.js`), remove failing tests without approval

**Spec template:**

```markdown
# Spec: [Feature Name]

## Objective

[What we're building and why. Acceptance criteria.]

## Tech Stack

Chart.js 3, D3 7, esbuild, Jest

## Commands

Build: npm run build
Test: npm test
Dev: npm run local

## Project Structure

[Where new files go, following existing conventions]

## Code Style

Prettier (single quotes, tab width 4), ES modules

## Testing Strategy

Jest + jsdom + jest-canvas-mock. TDD: Red → Green → Refactor.

## Boundaries

- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria

[Specific, testable conditions]

## Open Questions

[Anything unresolved]
```

### Phase 2: Plan

With the validated spec, generate a technical implementation plan. See `planning-and-task-breakdown`.

### Phase 3: Tasks

Break the plan into discrete, implementable tasks. Each task includes a TDD verification step:

```markdown
- [ ] Task: [Description]
  - Acceptance: [What must be true when done]
  - TDD: Write failing test → implement → green → refactor
  - Verify: `npm test` passes, `npm run build` succeeds
  - Files: [Which files will be touched]
```

### Phase 4: Implement

Execute tasks one at a time following `incremental-implementation` with TDD:

1. Write a failing test for the slice (Red)
2. Implement the minimum code to pass (Green)
3. Refactor while keeping tests green
4. Commit
5. Move to next slice

## Common Rationalizations

| Rationalization                       | Reality                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| "This is simple, I don't need a spec" | Simple tasks don't need _long_ specs, but they still need acceptance criteria.                 |
| "I'll write the spec after I code it" | That's documentation, not specification. The spec's value is in forcing clarity _before_ code. |
| "The spec will slow us down"          | A 15-minute spec prevents hours of rework.                                                     |
| "Requirements will change anyway"     | That's why the spec is a living document.                                                      |

## Verification

Before proceeding to implementation, confirm:

- [ ] The spec covers all six core areas
- [ ] The human has reviewed and approved the spec
- [ ] Success criteria are specific and testable
- [ ] Boundaries (Always/Ask First/Never) are defined
- [ ] Testing strategy specifies TDD (Red → Green → Refactor)
