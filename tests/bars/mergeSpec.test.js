import mergeSpec from "../../src/bars/mergeSpec.js";

const data = [{ cat: "A", val: 10 }];
const minimalSpec = { mapping: { x: "cat", y: "val" } };

describe("bars/mergeSpec", () => {
  test("applies default orientation when not specified", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.orientation).toBe("vertical");
  });

  test("preserves user-supplied orientation", () => {
    const merged = mergeSpec(data, { ...minimalSpec, orientation: "horizontal" });
    expect(merged.orientation).toBe("horizontal");
  });

  test("applies default scales", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.scales.x.type).toBe("category");
    expect(merged.scales.y.type).toBe("linear");
  });

  test("merges user scales with defaults", () => {
    const merged = mergeSpec(data, {
      ...minimalSpec,
      scales: { x: { label: "Category" } },
    });
    expect(merged.scales.x.label).toBe("Category");
    expect(merged.scales.x.type).toBe("category");
    expect(merged.scales.y.type).toBe("linear");
  });

  test("applies default theme", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.theme.maintainAspectRatio).toBe(false);
    expect(merged.theme.animation).toBe(false);
  });

  test("merges user theme with defaults", () => {
    const merged = mergeSpec(data, {
      ...minimalSpec,
      theme: { maintainAspectRatio: true },
    });
    expect(merged.theme.maintainAspectRatio).toBe(true);
    expect(merged.theme.animation).toBe(false);
  });

  test("stores the data array on the merged spec", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.data).toBe(data);
  });

  test("preserves mapping as-is", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.mapping).toEqual(minimalSpec.mapping);
  });

  test("applies default labels as empty object", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.labels).toEqual({});
  });

  test("preserves user labels", () => {
    const merged = mergeSpec(data, {
      ...minimalSpec,
      labels: { title: "My Chart" },
    });
    expect(merged.labels.title).toBe("My Chart");
  });

  test("applies default position of stack", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(merged.position).toBe("stack");
  });

  test("preserves user-supplied position", () => {
    const merged = mergeSpec(data, { ...minimalSpec, position: "dodge" });
    expect(merged.position).toBe("dodge");
  });

  test("merges scales.fill when provided", () => {
    const merged = mergeSpec(data, {
      ...minimalSpec,
      scales: { fill: { palette: ["#ff0000"] } },
    });
    expect(merged.scales.fill.palette).toEqual(["#ff0000"]);
  });

  test("defaults scales.fill to include the default palette", () => {
    const merged = mergeSpec(data, minimalSpec);
    expect(Array.isArray(merged.scales.fill.palette)).toBe(true);
    expect(merged.scales.fill.palette.length).toBeGreaterThan(0);
  });
});
