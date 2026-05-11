---
name: code-review-and-quality
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human.
---

# Code Review and Quality

## Overview

Multi-dimensional code review with quality gates. Every change gets reviewed before merge. Review covers five axes: correctness, readability, architecture, security, and performance.

**The approval standard:** Approve a change when it definitely improves overall code health, even if it isn't perfect.

## The Five-Axis Review

### 1. Correctness

- Does the code match the spec or task requirements?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled?
- Does it pass all tests? Were tests written before implementation (TDD)?

### 2. Readability & Simplicity

- Are names descriptive and consistent with gsm.viz conventions?
- Is the control flow straightforward?
- Could this be done in fewer lines?
- Are abstractions earning their complexity?
- Follows Prettier config (single quotes, tab width 4)?

### 3. Architecture

- Does it follow existing gsm.viz module patterns?
- Does it maintain clean module boundaries between chart types?
- Are data transformations separated from rendering?
- Are dependencies flowing correctly (data/ → chart module → component)?

### 4. Security

- Is user input validated?
- Are external data sources treated as untrusted?
- No secrets in code or version control?

### 5. Performance

- Any unnecessary re-renders in React components?
- Any unbounded data processing loops?
- Chart.js configuration optimized for the data size?

## TDD Verification in Review

**Every review must verify TDD compliance:**

- [ ] Were failing tests written before implementation?
- [ ] Do tests describe behavior, not implementation details?
- [ ] Do bug fixes include a reproduction test?
- [ ] Test names are descriptive?
- [ ] No tests were skipped or disabled?

**Flag any PR that adds functionality without corresponding tests.**

## Change Sizing

```
~100 lines changed   → Good. Reviewable in one sitting.
~300 lines changed   → Acceptable if it's a single logical change.
~1000 lines changed  → Too large. Split it.
```

## Finding Severity Labels

| Prefix        | Meaning         | Author Action                             |
| ------------- | --------------- | ----------------------------------------- |
| _(no prefix)_ | Required change | Must address before merge                 |
| **Critical:** | Blocks merge    | Security, data loss, broken functionality |
| **Nit:**      | Minor, optional | Author may ignore                         |
| **Optional:** | Suggestion      | Worth considering                         |
| **FYI**       | Informational   | No action needed                          |

## Review Process

1. **Understand the context** — What is this change trying to accomplish?
2. **Review the tests first** — Tests reveal intent and coverage. Verify TDD was followed.
3. **Review the implementation** — Walk through with five axes in mind.
4. **Categorize findings** — Label every comment with severity.
5. **Verify the verification** — Were tests run? Does the build pass?

## The Review Checklist

```markdown
## Review: [Change title]

### TDD Compliance

- [ ] Failing tests written before implementation
- [ ] Tests cover the change adequately
- [ ] Bug fixes include reproduction tests

### Correctness

- [ ] Change matches spec/task requirements
- [ ] Edge cases handled

### Readability

- [ ] Names are clear and consistent
- [ ] Logic is straightforward
- [ ] Follows Prettier formatting

### Architecture

- [ ] Follows existing gsm.viz module patterns
- [ ] Data transforms separated from rendering

### Security

- [ ] No secrets in code
- [ ] External data validated

### Performance

- [ ] No unnecessary re-renders
- [ ] No unbounded operations

### Verification

- [ ] Tests pass: npm test
- [ ] Build succeeds: npm run bundle
```

## Common Rationalizations

| Rationalization                      | Reality                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| "It works, that's good enough"       | Working code without tests creates debt that compounds. |
| "We'll add tests later"              | Later never comes. TDD means tests come first.          |
| "AI-generated code is probably fine" | AI code needs more scrutiny, not less.                  |

## Red Flags

- PRs merged without review
- New functionality without corresponding tests
- No evidence of TDD (tests written after implementation)
- Large PRs that are "too big to review properly"
- "LGTM" without evidence of actual review
