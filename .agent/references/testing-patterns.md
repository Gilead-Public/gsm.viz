# Testing Patterns Reference for gsm.viz

Quick reference for common testing patterns. Use alongside the `test-driven-development` skill.

## Test Structure (Arrange-Act-Assert)

```javascript
it("describes expected behavior", () => {
  // Arrange: Set up test data and preconditions
  const data = [
    { site: "Site A", value: 1.5, flagged: true },
    { site: "Site B", value: 2.0, flagged: false },
  ];

  // Act: Perform the action being tested
  const result = processChartData(data);

  // Assert: Verify the outcome
  expect(result.datasets[0].data).toHaveLength(2);
  expect(result.labels).toEqual(["Site A", "Site B"]);
});
```

## Test Naming Conventions

```javascript
// Pattern: [unit] [expected behavior] [condition]
describe("buildBarConfig", () => {
  it("creates bar chart config with correct axis labels", () => {});
  it("throws when data array is empty", () => {});
  it("filters out null values from dataset", () => {});
  it("applies custom colors when provided", () => {});
});
```

## Common Assertions

```javascript
// Equality
expect(result).toBe(expected); // Strict equality (===)
expect(result).toEqual(expected); // Deep equality (objects/arrays)

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeNull();
expect(result).toBeDefined();

// Numbers
expect(result).toBeGreaterThan(5);
expect(result).toBeCloseTo(0.3, 5); // Floating point

// Strings
expect(result).toMatch(/pattern/);
expect(result).toContain("substring");

// Arrays / Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty("key", "value");

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow("specific message");

// Async
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow(Error);
```

## Mocking Patterns

### Mock Functions

```javascript
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: "test" });

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
expect(mockFn).toHaveBeenCalledTimes(3);
```

### Mock Modules

```javascript
// Mock an entire module
jest.mock("./database", () => ({
  query: jest.fn().mockResolvedValue([{ id: 1, title: "Test" }]),
}));

// Mock specific exports
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  generateId: jest.fn().mockReturnValue("test-id"),
}));
```

### Mock Boundaries for gsm.viz

```
Mock these:                    Don't mock these:
├── Canvas context (jest-      ├── Data transformation functions
│   canvas-mock handles this)  ├── Chart.js configuration builders
├── DOM APIs not in jsdom      ├── Utility functions
├── External data fetching     ├── Color/formatting helpers
├── Browser resize events      ├── Statistical calculations
└── Date/time (when needed)    └── Pure business logic
```

## Chart Rendering Testing

```javascript
describe("renderBarChart", () => {
  it("creates a canvas element in the container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    renderBarChart(container, testData, testOptions);

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeDefined();

    document.body.removeChild(container);
  });

  it("shows empty state when no data provided", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    renderBarChart(container, [], testOptions);

    expect(container.textContent).toMatch(/no data/i);

    document.body.removeChild(container);
  });
});
```

## Chart.js Configuration Testing

```javascript
describe("buildScatterConfig", () => {
  it("maps data points to Chart.js format", () => {
    const input = [
      { site: "Site A", metric: 1.5, baseline: 1.0 },
      { site: "Site B", metric: 2.0, baseline: 1.5 },
    ];

    const config = buildScatterConfig(input);

    expect(config.type).toBe("scatter");
    expect(config.data.datasets[0].data).toEqual([
      { x: 1.0, y: 1.5 },
      { x: 1.5, y: 2.0 },
    ]);
  });

  it("adds annotation line at threshold value", () => {
    const config = buildScatterConfig(data, { threshold: 2.0 });

    expect(config.options.plugins.annotation.annotations).toBeDefined();
  });
});
```

## D3 Testing

```javascript
describe("D3 sparkline", () => {
  it("creates SVG with correct dimensions", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    renderSparkline(container, data, { width: 200, height: 50 });

    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg.getAttribute("width")).toBe("200");
    expect(svg.getAttribute("height")).toBe("50");

    document.body.removeChild(container);
  });
});
```

## Test Anti-Patterns

| Anti-Pattern                       | Problem                   | Better Approach               |
| ---------------------------------- | ------------------------- | ----------------------------- |
| Testing implementation details     | Breaks on refactor        | Test inputs/outputs           |
| Snapshot everything                | No one reviews diffs      | Assert specific values        |
| Shared mutable state               | Tests pollute each other  | Setup/teardown per test       |
| Testing Chart.js internals         | Not your code             | Test YOUR configuration logic |
| Skipping canvas tests              | Hides bugs                | Use jest-canvas-mock          |
| Over-mocking                       | Tests pass but app breaks | Mock at boundaries only       |
| Writing tests after implementation | Not TDD                   | Write failing test FIRST      |
