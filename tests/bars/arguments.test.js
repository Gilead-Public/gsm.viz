/**
 * @jest-environment jsdom
 */

import bars from "../../src/bars.js";

// Mock ResizeObserver for tests that attach elements to document.body.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const singleSeriesSpec = {
  data: [
    { category: "A", value: 10 },
    { category: "B", value: 20 },
    { category: "C", value: 30 },
  ],
  mapping: { x: "category", y: "value" },
};

const multiSeriesSpec = {
  data: [
    { category: "A", value: 10, group: "X" },
    { category: "A", value: 5, group: "Y" },
    { category: "B", value: 20, group: "X" },
    { category: "B", value: 15, group: "Y" },
  ],
  mapping: { x: "category", y: "value", fill: "group" },
};

describe("bars entry point", () => {
  const container = document.createElement("div");

  test("renders with minimal spec", () => {
    const instance = bars(container, singleSeriesSpec);
    expect(instance).not.toBeNull();
    expect(instance.data.datasets).toHaveLength(1);
  });

  test("renders with multi-series spec", () => {
    const instance = bars(container, multiSeriesSpec);
    expect(instance).not.toBeNull();
    expect(instance.data.datasets).toHaveLength(2);
  });

  test("renders with empty data", () => {
    const instance = bars(container, {
      data: [],
      mapping: { x: "a", y: "b" },
    });
    expect(instance).not.toBeNull();
  });

  test("renders horizontal bars", () => {
    const instance = bars(container, {
      ...singleSeriesSpec,
      orientation: "horizontal",
    });
    expect(instance.options.indexAxis).toBe("y");
  });

  test("renders vertical bars by default", () => {
    const instance = bars(container, singleSeriesSpec);
    expect(instance.options.indexAxis).toBe("x");
  });

  test("applies labels.title as chart title", () => {
    const instance = bars(container, {
      ...singleSeriesSpec,
      labels: { title: "Test Title" },
    });
    expect(instance.options.plugins.title.text).toBe("Test Title");
    expect(instance.options.plugins.title.display).toBe(true);
  });

  test("attaches helpers to chart instance", () => {
    const instance = bars(container, singleSeriesSpec);
    expect(instance.helpers).toBeDefined();
    expect(typeof instance.helpers.updateData).toBe("function");
    expect(typeof instance.helpers.updateSpec).toBe("function");
  });

  test("stores the merged spec on chart.data._spec_", () => {
    const instance = bars(container, singleSeriesSpec);
    expect(instance.data._spec_).toBeDefined();
    expect(instance.data._spec_.orientation).toBe("vertical");
  });

  test("respects explicit category order", () => {
    const instance = bars(container, {
      ...singleSeriesSpec,
      scales: { x: { order: ["C", "B", "A"] } },
    });
    expect(instance.data.labels).toEqual(["C", "B", "A"]);
  });

  test("renders count mode when mapping.y is omitted", () => {
    const instance = bars(container, {
      data: [{ cat: "A" }, { cat: "A" }, { cat: "B" }],
      mapping: { x: "cat" },
    });
    expect(instance.data.datasets).toHaveLength(1);
    const data = instance.data.datasets[0].data;
    expect(data.find((d) => d.x === "A").y).toBe(2);
    expect(data.find((d) => d.x === "B").y).toBe(1);
  });

  test("renders stacked bars with position stack", () => {
    const instance = bars(container, {
      ...multiSeriesSpec,
      position: "stack",
    });
    expect(instance.options.scales.x.stacked).toBe(true);
    expect(instance.options.scales.y.stacked).toBe(true);
  });

  test("renders grouped bars with position dodge", () => {
    const instance = bars(container, {
      ...multiSeriesSpec,
      position: "dodge",
    });
    expect(instance.options.scales.x.stacked).toBeUndefined();
    expect(instance.options.scales.y.stacked).toBeUndefined();
  });

  test("defaults to stacked position", () => {
    const instance = bars(container, multiSeriesSpec);
    expect(instance.options.scales.x.stacked).toBe(true);
    expect(instance.options.scales.y.stacked).toBe(true);
  });

  test("applies fill palette colors to datasets", () => {
    const instance = bars(container, {
      ...multiSeriesSpec,
      scales: { fill: { palette: ["#ff0000", "#00ff00"] } },
    });
    expect(instance.data.datasets[0].backgroundColor).toBe("#ff0000");
    expect(instance.data.datasets[1].backgroundColor).toBe("#00ff00");
  });

  test("resolves a CSS selector string to a DOM element", () => {
    const div = document.createElement("div");
    div.id = "bars-test-selector";
    document.body.appendChild(div);
    const instance = bars("#bars-test-selector", singleSeriesSpec);
    expect(instance).not.toBeNull();
    expect(instance.data.datasets).toHaveLength(1);
    document.body.removeChild(div);
  });

  test("throws when a CSS selector matches nothing", () => {
    expect(() => bars("#nonexistent", singleSeriesSpec)).toThrow(
      "could not find element"
    );
  });

  test("horizontal orientation produces correct data point shape", () => {
    const instance = bars(container, {
      ...singleSeriesSpec,
      orientation: "horizontal",
    });
    const point = instance.data.datasets[0].data[0];
    expect(typeof point.x).toBe("number");
    expect(typeof point.y).toBe("string");
  });
});
