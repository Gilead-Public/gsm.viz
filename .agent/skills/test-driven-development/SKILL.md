---
name: test-driven-development
description: Drives development with tests. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# Test-Driven Development

## Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done.

**This is the mandatory development approach for gsm.viz.** All code changes follow Red → Green → Refactor.

## Testing Stack

- **Framework:** Jest
- **Environment:** jsdom (`jest-environment-jsdom`)
- **Canvas mocking:** jest-canvas-mock (required for Chart.js rendering)
- **Transpilation:** Babel (preset-env, preset-react)
- **Run tests:** `npm test`
- **Run with coverage:** `npm run test:coverage`
- **Test location:** `tests/` directory

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
      │                  │                    │
      ▼                  ▼                    ▼
   Test FAILS        Test PASSES         Tests still PASS
```

### Step 1: RED — Write a Failing Test

Write the test first. It must fail. A test that passes immediately proves nothing.

```javascript
// RED: This test fails because calculateMetric doesn't handle edge case
describe("calculateMetric", () => {
  it("returns null when input array is empty", () => {
    const result = calculateMetric([]);
    expect(result).toBeNull();
  });
});
```

### Step 2: GREEN — Make It Pass

Write the minimum code to make the test pass:

```javascript
// GREEN: Minimal implementation
export function calculateMetric(data) {
  if (data.length === 0) return null;
  // ... existing logic
}
```

### Step 3: REFACTOR — Clean Up

With tests green, improve the code without changing behavior. Run `npm test` after every refactor step.

## The Prove-It Pattern (Bug Fixes)

When a bug is reported, **do not start by trying to fix it.** Start by writing a test that reproduces it.

```
Bug report arrives
       │
       ▼
  Write a test that demonstrates the bug
       │
       ▼
  Test FAILS (confirming the bug exists)
       │
       ▼
  Implement the fix
       │
       ▼
  Test PASSES (proving the fix works)
       │
       ▼
  Run full test suite: npm test (no regressions)
```

**Example:**

```javascript
// Bug: "Scatter plot tooltip shows wrong site name for flagged points"

// Step 1: Write the reproduction test (it should FAIL)
it("displays correct site name in tooltip for flagged data points", () => {
  const data = [
    { site: "Site A", value: 1.5, flagged: true },
    { site: "Site B", value: 2.0, flagged: false },
  ];
  const tooltip = generateTooltipContent(data[0]);
  expect(tooltip).toContain("Site A"); // This fails → bug confirmed
});

// Step 2: Fix the bug in the tooltip generation logic

// Step 3: Test passes → bug fixed, regression guarded
```

## The Test Pyramid

```
          ╱╲
         ╱  ╲         E2E Tests (~5%)
        ╱    ╲        Full chart rendering with real data
       ╱──────╲
      ╱        ╲      Integration Tests (~15%)
     ╱          ╲     Component rendering, data pipeline
    ╱────────────╲
   ╱              ╲   Unit Tests (~80%)
  ╱                ╲  Pure logic, data transforms, config builders
 ╱──────────────────╲
```

## Writing Good Tests for gsm.viz

### Test Structure (Arrange-Act-Assert)

```javascript
it("creates chart configuration with correct axis labels", () => {
  // Arrange
  const data = { labels: ["Site 1", "Site 2"], values: [1.2, 3.4] };
  const options = { xLabel: "Site", yLabel: "Metric" };

  // Act
  const config = buildChartConfig(data, options);

  // Assert
  expect(config.options.scales.x.title.text).toBe("Site");
  expect(config.options.scales.y.title.text).toBe("Metric");
});
```

### Test State, Not Interactions

```javascript
// Good: Tests what the function produces
it("filters data points below threshold", () => {
  const data = [{ value: 1 }, { value: 5 }, { value: 3 }];
  const result = filterByThreshold(data, 3);
  expect(result).toEqual([{ value: 5 }, { value: 3 }]);
});

// Bad: Tests how the function works internally
it("calls Array.filter with the right predicate", () => {
  // Don't do this
});
```

### DAMP Over DRY in Tests

Each test should tell a complete story without requiring the reader to trace through shared helpers. Duplication in tests is acceptable when it makes each test independently understandable.

### One Assertion Per Concept

```javascript
// Good: Each test verifies one behavior
it("excludes sites with missing data", () => {
  /* ... */
});
it("sorts sites alphabetically by default", () => {
  /* ... */
});
it("applies custom sort when specified", () => {
  /* ... */
});
```

## Mocking Patterns for gsm.viz

```
Mock these:                    Don't mock these:
├── Canvas context (jest-      ├── Data transformation functions
│   canvas-mock handles this)  ├── Configuration builders
├── DOM APIs not in jsdom      ├── Utility functions
├── External data fetching     ├── Pure business logic
└── Browser resize events      └── Chart.js config objects
```

## Common Rationalizations

| Rationalization                         | Reality                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| "I'll write tests after the code works" | You won't. And tests written after the fact test implementation, not behavior.        |
| "This is too simple to test"            | Simple code gets complicated. The test documents the expected behavior.               |
| "Tests slow me down"                    | Tests slow you down now. They speed you up every time you change the code later.      |
| "I tested it manually in the browser"   | Manual testing doesn't persist. Tomorrow's change might break it with no way to know. |
| "It's just a prototype"                 | Prototypes become production code. Tests from day one prevent test debt.              |

## Red Flags

- Writing code without any corresponding tests
- Tests that pass on the first run (they may not be testing what you think)
- Bug fixes without reproduction tests
- Tests that test framework behavior instead of application behavior
- Test names that don't describe the expected behavior
- Skipping tests to make the suite pass

## Verification

After completing any implementation:

- [ ] Every new behavior has a corresponding test
- [ ] All tests pass: `npm test`
- [ ] Bug fixes include a reproduction test that failed before the fix
- [ ] Test names describe the behavior being verified
- [ ] No tests were skipped or disabled
