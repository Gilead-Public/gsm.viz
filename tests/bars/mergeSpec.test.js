import mergeSpec from "../../src/bars/mergeSpec.js";

describe("bars/mergeSpec", () => {
  const minimalSpec = {
    data: [{ cat: "A", val: 10 }],
    mapping: { x: "cat", y: "val" },
  };

  test("applies default orientation when not specified", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.orientation).toBe("vertical");
  });

  test("preserves user-supplied orientation", () => {
    const merged = mergeSpec({ ...minimalSpec, orientation: "horizontal" });
    expect(merged.orientation).toBe("horizontal");
  });

  test("applies default scales", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.scales.x.type).toBe("category");
    expect(merged.scales.y.type).toBe("linear");
  });

  test("merges user scales with defaults", () => {
    const merged = mergeSpec({
      ...minimalSpec,
      scales: { x: { label: "Category" } },
    });
    expect(merged.scales.x.label).toBe("Category");
    expect(merged.scales.x.type).toBe("category");
    expect(merged.scales.y.type).toBe("linear");
  });

  test("applies default theme", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.theme.maintainAspectRatio).toBe(false);
    expect(merged.theme.animation).toBe(false);
  });

  test("merges user theme with defaults", () => {
    const merged = mergeSpec({
      ...minimalSpec,
      theme: { maintainAspectRatio: true },
    });
    expect(merged.theme.maintainAspectRatio).toBe(true);
    expect(merged.theme.animation).toBe(false);
  });

  test("preserves data and mapping as-is", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.data).toBe(minimalSpec.data);
    expect(merged.mapping).toEqual(minimalSpec.mapping);
  });

  test("applies default labels as empty object", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.labels).toEqual({});
  });

  test("preserves user labels", () => {
    const merged = mergeSpec({
      ...minimalSpec,
      labels: { title: "My Chart" },
    });
    expect(merged.labels.title).toBe("My Chart");
  });

  test("applies default position of stack", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.position).toBe("stack");
  });

  test("preserves user-supplied position", () => {
    const merged = mergeSpec({ ...minimalSpec, position: "dodge" });
    expect(merged.position).toBe("dodge");
  });

  test("merges scales.fill when provided", () => {
    const merged = mergeSpec({
      ...minimalSpec,
      scales: { fill: { palette: ["#ff0000"] } },
    });
    expect(merged.scales.fill.palette).toEqual(["#ff0000"]);
  });

  test("defaults scales.fill to empty object", () => {
    const merged = mergeSpec(minimalSpec);
    expect(merged.scales.fill).toEqual({});
  });
});
