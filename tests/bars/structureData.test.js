import structureData from "../../src/bars/structureData.js";

describe("bars/structureData", () => {
  describe("single series (no fill mapping)", () => {
    const spec = {
      data: [
        { site: "B", score: 20 },
        { site: "A", score: 10 },
        { site: "C", score: 30 },
      ],
      mapping: { x: "site", y: "score" },
      orientation: "vertical",
      scales: { x: {}, y: {} },
    };

    test("returns a single dataset", () => {
      const result = structureData(spec);
      expect(result.datasets).toHaveLength(1);
    });

    test("dataset data contains parsed x/y values", () => {
      const result = structureData(spec);
      const data = result.datasets[0].data;
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: "A", y: 10 }),
          expect.objectContaining({ x: "B", y: 20 }),
          expect.objectContaining({ x: "C", y: 30 }),
        ])
      );
    });

    test("categories are sorted alphanumerically by default", () => {
      const result = structureData(spec);
      expect(result.labels).toEqual(["A", "B", "C"]);
    });

    test("data is ordered to match category order", () => {
      const result = structureData(spec);
      const data = result.datasets[0].data;
      expect(data.map((d) => d.x)).toEqual(["A", "B", "C"]);
    });
  });

  describe("explicit category order", () => {
    const spec = {
      data: [
        { site: "B", score: 20 },
        { site: "A", score: 10 },
        { site: "C", score: 30 },
      ],
      mapping: { x: "site", y: "score" },
      orientation: "vertical",
      scales: { x: { order: ["C", "A", "B"] }, y: {} },
    };

    test("respects explicit category order", () => {
      const result = structureData(spec);
      expect(result.labels).toEqual(["C", "A", "B"]);
    });

    test("data is ordered to match explicit order", () => {
      const result = structureData(spec);
      const data = result.datasets[0].data;
      expect(data.map((d) => d.x)).toEqual(["C", "A", "B"]);
    });

    test("categories in data but not in order are appended alphanumerically", () => {
      const specPartial = {
        ...spec,
        data: [
          ...spec.data,
          { site: "D", score: 40 },
          { site: "E", score: 50 },
        ],
        scales: { x: { order: ["C"] }, y: {} },
      };
      const result = structureData(specPartial);
      expect(result.labels).toEqual(["C", "A", "B", "D", "E"]);
    });

    test("order values with no matching data are dropped", () => {
      const specExtra = {
        ...spec,
        scales: {
          x: { order: ["Z", "C", "A", "B"] },
          y: {},
        },
      };
      const result = structureData(specExtra);
      expect(result.labels).toEqual(["C", "A", "B"]);
    });
  });

  describe("multi-series (fill mapping)", () => {
    const spec = {
      data: [
        { site: "A", score: 10, group: "X" },
        { site: "A", score: 5, group: "Y" },
        { site: "B", score: 20, group: "X" },
        { site: "B", score: 15, group: "Y" },
      ],
      mapping: { x: "site", y: "score", fill: "group" },
      orientation: "vertical",
      scales: { x: {}, y: {} },
    };

    test("creates one dataset per unique fill value", () => {
      const result = structureData(spec);
      expect(result.datasets).toHaveLength(2);
    });

    test("datasets are labeled by their fill value", () => {
      const result = structureData(spec);
      const labels = result.datasets.map((ds) => ds.label);
      expect(labels).toEqual(["X", "Y"]);
    });

    test("each dataset contains data only for its fill value", () => {
      const result = structureData(spec);
      const xDataset = result.datasets.find((ds) => ds.label === "X");
      expect(xDataset.data).toHaveLength(2);
      expect(xDataset.data.every((d) => d._fill === "X")).toBe(true);
    });
  });

  describe("coercion and metadata", () => {
    test("coerces y values to numbers", () => {
      const spec = {
        data: [{ cat: "A", val: "42" }],
        mapping: { x: "cat", y: "val" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets[0].data[0].y).toBe(42);
    });

    test("treats falsy y values as 0", () => {
      const spec = {
        data: [
          { cat: "A", val: null },
          { cat: "B", val: undefined },
          { cat: "C", val: "" },
        ],
        mapping: { x: "cat", y: "val" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      const ys = result.datasets[0].data.map((d) => d.y);
      expect(ys).toEqual([0, 0, 0]);
    });

    test("preserves original datum as _datum", () => {
      const datum = { cat: "A", val: 10, extra: "info" };
      const spec = {
        data: [datum],
        mapping: { x: "cat", y: "val" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets[0].data[0]._datum).toBe(datum);
    });
  });

  describe("empty data", () => {
    test("returns empty datasets and labels for empty data", () => {
      const spec = {
        data: [],
        mapping: { x: "cat", y: "val" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].data).toEqual([]);
      expect(result.labels).toEqual([]);
    });
  });

  describe("alphanumeric sorting", () => {
    test("sorts numerically-prefixed categories correctly", () => {
      const spec = {
        data: [
          { cat: "10-Site", val: 1 },
          { cat: "2-Site", val: 2 },
          { cat: "1-Site", val: 3 },
        ],
        mapping: { x: "cat", y: "val" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.labels).toEqual(["1-Site", "10-Site", "2-Site"]);
    });
  });
});
