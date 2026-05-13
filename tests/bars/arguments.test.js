/**
 * @jest-environment jsdom
 */

import bars from "../../src/bars.js";

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
});
