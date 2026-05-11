---
name: debugging-and-error-recovery
description: Guides systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected error.
---

# Debugging and Error Recovery

## Overview

Systematic debugging with structured triage. When something breaks, stop adding features, preserve evidence, and follow a structured process to find and fix the root cause. Guessing wastes time.

## When to Use

- Tests fail after a code change
- The build breaks (`npm run bundle` fails)
- Runtime behavior doesn't match expectations
- A bug report arrives
- Chart rendering produces unexpected output

## The Stop-the-Line Rule

When anything unexpected happens:

```
1. STOP adding features or making changes
2. PRESERVE evidence (error output, logs, repro steps)
3. DIAGNOSE using the triage checklist
4. REPRODUCE with a failing test (TDD)
5. FIX the root cause
6. VERIFY the test passes and no regressions exist
7. RESUME only after verification passes
```

## The Triage Checklist

### Step 1: Reproduce

Make the failure happen reliably.

For gsm.viz test failures:

```bash
# Run the specific failing test
npx jest --verbose --testPathPattern="specific-file"

# Run in isolation
npx jest --runInBand --testPathPattern="specific-file"
```

### Step 2: Localize

```
Which layer is failing?
├── Data transformation    → Check input data shape, utility functions
├── Chart configuration    → Check Chart.js config objects
├── Chart rendering       → Check config objects, data flow, canvas output
├── Build tooling          → Check esbuild config, imports
├── Test environment       → Check jest-canvas-mock, jsdom setup
└── Test itself            → Check if the test is correct
```

### Step 3: Reduce

Create the minimal failing case — strip to the smallest input that triggers the failure.

### Step 4: Write a Regression Test (TDD)

**Before fixing the bug, write a test that reproduces it.** This is the Prove-It Pattern:

```javascript
// Bug: "Bar chart crashes when data contains null values"

// Step 1: Write reproduction test — it should FAIL
it("handles null values in data without crashing", () => {
  const data = [
    { site: "Site A", value: 1.5 },
    { site: "Site B", value: null },
    { site: "Site C", value: 2.0 },
  ];
  expect(() => buildBarConfig(data)).not.toThrow();
});

// Step 2: Confirm test FAILS with current code (Red)
// Step 3: Fix the bug (Green)
// Step 4: Refactor if needed
// Step 5: Run full suite: npm test
```

### Step 5: Fix the Root Cause

Fix the underlying issue, not the symptom:

```
Symptom: "Chart shows wrong colors for flagged sites"

Symptom fix (bad):
  → Override colors in the component after rendering

Root cause fix (good):
  → The color mapping function doesn't account for the flagged property
  → Fix the mapping function
```

### Step 6: Verify End-to-End

```bash
# Run the specific test
npx jest --testPathPattern="specific-file"

# Run the full test suite
npm test

# Build the project
npm run bundle
```

## Error-Specific Patterns

### Test Failure Triage

```
Test fails after code change:
├── Did you change code the test covers?
│   └── YES → Is the test or the code wrong?
├── Did you change unrelated code?
│   └── YES → Likely a side effect (shared state, imports)
└── Canvas-related error?
    └── Check jest-canvas-mock setup in jest.config.js
```

### Build Failure Triage

```
Build fails (npm run bundle):
├── Import error → Check module paths, named exports
├── Syntax error → Check Babel config, module syntax
├── Dependency error → Run npm install
└── esbuild error → Check esbuild config in package.json
```

## Common Rationalizations

| Rationalization                            | Reality                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| "I know what the bug is, I'll just fix it" | Write the reproduction test first. It takes 2 minutes and provides permanent regression coverage. |
| "The failing test is probably wrong"       | Verify that assumption. If the test is wrong, fix the test. Don't skip it.                        |
| "I'll fix it in the next commit"           | Fix it now. The next commit will introduce new issues on top of this one.                         |

## Red Flags

- Skipping a failing test to work on new features
- Fixing bugs without writing a reproduction test first
- Guessing at fixes without reproducing the bug
- "It works now" without understanding what changed
- Multiple unrelated changes made while debugging

## Verification

After fixing a bug:

- [ ] Root cause is identified
- [ ] A regression test exists that fails without the fix (Red)
- [ ] The fix makes the test pass (Green)
- [ ] All existing tests pass: `npm test`
- [ ] Build succeeds: `npm run bundle`
