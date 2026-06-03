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

  describe("count mode (no y mapping)", () => {
    test("counts rows per category when y mapping is omitted", () => {
      const spec = {
        data: [
          { cat: "A" },
          { cat: "A" },
          { cat: "B" },
          { cat: "B" },
          { cat: "B" },
        ],
        mapping: { x: "cat" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets).toHaveLength(1);
      const data = result.datasets[0].data;
      expect(data.find((d) => d.x === "A").y).toBe(2);
      expect(data.find((d) => d.x === "B").y).toBe(3);
    });

    test("counts rows per category per fill group", () => {
      const spec = {
        data: [
          { cat: "A", grp: "X" },
          { cat: "A", grp: "X" },
          { cat: "A", grp: "Y" },
          { cat: "B", grp: "X" },
        ],
        mapping: { x: "cat", fill: "grp" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets).toHaveLength(2);
      const xDataset = result.datasets.find((ds) => ds.label === "X");
      const yDataset = result.datasets.find((ds) => ds.label === "Y");
      expect(xDataset.data.find((d) => d.x === "A").y).toBe(2);
      expect(xDataset.data.find((d) => d.x === "B").y).toBe(1);
      expect(yDataset.data.find((d) => d.x === "A").y).toBe(1);
    });

    test("respects explicit category order in count mode", () => {
      const spec = {
        data: [{ cat: "B" }, { cat: "A" }, { cat: "B" }],
        mapping: { x: "cat" },
        orientation: "vertical",
        scales: { x: { order: ["B", "A"] }, y: {} },
      };
      const result = structureData(spec);
      expect(result.labels).toEqual(["B", "A"]);
      expect(result.datasets[0].data.map((d) => d.x)).toEqual(["B", "A"]);
    });

    test("preserves _datum array in count mode", () => {
      const d1 = { cat: "A", extra: 1 };
      const d2 = { cat: "A", extra: 2 };
      const spec = {
        data: [d1, d2],
        mapping: { x: "cat" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets[0].data[0]._datum).toEqual([d1, d2]);
    });
  });

  describe("horizontal orientation", () => {
    test("swaps x/y in data points when orientation is horizontal", () => {
      const spec = {
        data: [
          { site: "A", score: 10 },
          { site: "B", score: 20 },
        ],
        mapping: { x: "site", y: "score" },
        orientation: "horizontal",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      const data = result.datasets[0].data;
      expect(data[0]).toEqual(expect.objectContaining({ x: 10, y: "A" }));
      expect(data[1]).toEqual(expect.objectContaining({ x: 20, y: "B" }));
    });

    test("swaps x/y in count mode with horizontal orientation", () => {
      const spec = {
        data: [{ cat: "A" }, { cat: "A" }, { cat: "B" }],
        mapping: { x: "cat" },
        orientation: "horizontal",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      const data = result.datasets[0].data;
      expect(data[0]).toEqual(expect.objectContaining({ x: 2, y: "A" }));
      expect(data[1]).toEqual(expect.objectContaining({ x: 1, y: "B" }));
    });

    test("keeps x/y unchanged when orientation is vertical", () => {
      const spec = {
        data: [{ site: "A", score: 10 }],
        mapping: { x: "site", y: "score" },
        orientation: "vertical",
        scales: { x: {}, y: {} },
      };
      const result = structureData(spec);
      expect(result.datasets[0].data[0]).toEqual(
        expect.objectContaining({ x: "A", y: 10 })
      );
    });
  });

  describe("fill order (scales.fill.order)", () => {
    const spec = {
      data: [
        { cat: "A", grp: "Z", val: 1 },
        { cat: "A", grp: "Y", val: 2 },
        { cat: "A", grp: "X", val: 3 },
      ],
      mapping: { x: "cat", y: "val", fill: "grp" },
      orientation: "vertical",
      scales: { x: {}, y: {}, fill: { order: ["X", "Y", "Z"] } },
    };

    test("reorders datasets according to scales.fill.order", () => {
      const result = structureData(spec);
      expect(result.datasets.map((ds) => ds.label)).toEqual(["X", "Y", "Z"]);
    });

    test("drops fill order values with no matching data", () => {
      const specExtra = {
        ...spec,
        scales: {
          x: {},
          y: {},
          fill: { order: ["W", "X", "Y", "Z"] },
        },
      };
      const result = structureData(specExtra);
      expect(result.datasets.map((ds) => ds.label)).toEqual(["X", "Y", "Z"]);
    });

    test("appends unordered fill values after ordered ones", () => {
      const specPartial = {
        ...spec,
        scales: {
          x: {},
          y: {},
          fill: { order: ["Z"] },
        },
      };
      const result = structureData(specPartial);
      expect(result.datasets[0].label).toBe("Z");
      expect(result.datasets).toHaveLength(3);
    });

    test("palette colors follow fill order", () => {
      const specWithPalette = {
        ...spec,
        scales: {
          x: {},
          y: {},
          fill: {
            order: ["X", "Y", "Z"],
            palette: ["#ff0000", "#00ff00", "#0000ff"],
          },
        },
      };
      const result = structureData(specWithPalette);
      expect(result.datasets[0].backgroundColor).toBe("#ff0000");
      expect(result.datasets[0].label).toBe("X");
      expect(result.datasets[2].backgroundColor).toBe("#0000ff");
      expect(result.datasets[2].label).toBe("Z");
    });

    test("assigns palette colors by fill.order position when some fill values are absent from data", () => {
      // fill.order has 5 slots; data only has 3 of the 5 fill values.
      // Colors must track the value's position in fill.order, not the
      // dataset's position in the (shorter) reordered array.
      const specMissing = {
        data: [
          { cat: "A", grp: "Z", val: 1 },
          { cat: "A", grp: "X", val: 3 },
          // "Y" is absent from data
        ],
        mapping: { x: "cat", y: "val", fill: "grp" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: {
            order: ["X", "Y", "Z"],
            palette: ["#ff0000", "#00ff00", "#0000ff"],
          },
        },
      };
      const result = structureData(specMissing);
      // Only X and Z datasets should be present
      expect(result.datasets).toHaveLength(2);
      const xDs = result.datasets.find((ds) => ds.label === "X");
      const zDs = result.datasets.find((ds) => ds.label === "Z");
      // X is at fill.order index 0 → palette[0] = #ff0000
      expect(xDs.backgroundColor).toBe("#ff0000");
      // Z is at fill.order index 2 → palette[2] = #0000ff
      expect(zDs.backgroundColor).toBe("#0000ff");
    });
  });

  describe("flag color alignment", () => {
    const FLAG_ORDER = ["-2", "-1", "0", "1", "2"];
    // Red, Amber, Green, Amber, Red — symmetric traffic-light palette
    const FLAG_PALETTE = ["#FF5859", "#FEAA02", "#3DAF06", "#FEAA02", "#FF5859"];

    test("all five flag values present → correct traffic-light colors", () => {
      const spec = {
        data: FLAG_ORDER.map((flag) => ({ cat: "A", flag })),
        mapping: { x: "cat", fill: "flag" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: { order: FLAG_ORDER, palette: FLAG_PALETTE },
        },
      };
      const result = structureData(spec);
      const byFlag = Object.fromEntries(
        result.datasets.map((ds) => [ds.label, ds.backgroundColor])
      );
      expect(byFlag["-2"]).toBe("#FF5859"); // red
      expect(byFlag["-1"]).toBe("#FEAA02"); // amber
      expect(byFlag["0"]).toBe("#3DAF06");  // green
      expect(byFlag["1"]).toBe("#FEAA02");  // amber
      expect(byFlag["2"]).toBe("#FF5859");  // red
    });

    test("all five flag values present → datasets ordered -2 to 2 (legend order)", () => {
      const spec = {
        // Data intentionally in reverse order to verify reordering.
        data: [...FLAG_ORDER].reverse().map((flag) => ({ cat: "A", flag })),
        mapping: { x: "cat", fill: "flag" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: { order: FLAG_ORDER, palette: FLAG_PALETTE },
        },
      };
      const result = structureData(spec);
      expect(result.datasets.map((ds) => ds.label)).toEqual([
        "-2",
        "-1",
        "0",
        "1",
        "2",
      ]);
    });

    test("only some flag values present → each flag still gets its designated color", () => {
      // Only flags -2, 0, and 2 appear in the data (no amber rows).
      const spec = {
        data: [
          { cat: "A", flag: "-2" },
          { cat: "B", flag: "0" },
          { cat: "C", flag: "2" },
        ],
        mapping: { x: "cat", fill: "flag" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: { order: FLAG_ORDER, palette: FLAG_PALETTE },
        },
      };
      const result = structureData(spec);
      expect(result.datasets).toHaveLength(3);
      const byFlag = Object.fromEntries(
        result.datasets.map((ds) => [ds.label, ds.backgroundColor])
      );
      expect(byFlag["-2"]).toBe("#FF5859"); // red  (fill.order index 0)
      expect(byFlag["0"]).toBe("#3DAF06");  // green (fill.order index 2)
      expect(byFlag["2"]).toBe("#FF5859");  // red  (fill.order index 4)
    });

    test("only some flag values present → datasets ordered by fill.order (legend order)", () => {
      // Data arrives in scrambled order; only -2, 0, 2 present.
      const spec = {
        data: [
          { cat: "C", flag: "2" },
          { cat: "A", flag: "-2" },
          { cat: "B", flag: "0" },
        ],
        mapping: { x: "cat", fill: "flag" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: { order: FLAG_ORDER, palette: FLAG_PALETTE },
        },
      };
      const result = structureData(spec);
      expect(result.datasets.map((ds) => ds.label)).toEqual(["-2", "0", "2"]);
    });

    test("numeric flag labels match string fill.order (type coercion)", () => {
      // Caller passes numeric flag values; fill.order uses strings.
      // reorderDatasets must coerce to string for comparison.
      const spec = {
        data: [
          { cat: "C", flag: 2 },
          { cat: "A", flag: -2 },
          { cat: "B", flag: 0 },
        ],
        mapping: { x: "cat", fill: "flag" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: { order: FLAG_ORDER, palette: FLAG_PALETTE },
        },
      };
      const result = structureData(spec);
      // Should be ordered by fill.order even though labels are numbers
      expect(result.datasets.map((ds) => String(ds.label))).toEqual([
        "-2",
        "0",
        "2",
      ]);
      // Colors must still align
      const byFlag = Object.fromEntries(
        result.datasets.map((ds) => [String(ds.label), ds.backgroundColor])
      );
      expect(byFlag["-2"]).toBe("#FF5859"); // red
      expect(byFlag["0"]).toBe("#3DAF06");  // green
      expect(byFlag["2"]).toBe("#FF5859");  // red
    });
  });

  describe("fill palette", () => {
    const spec = {
      data: [
        { site: "A", score: 10, group: "X" },
        { site: "B", score: 20, group: "Y" },
        { site: "C", score: 30, group: "Z" },
      ],
      mapping: { x: "site", y: "score", fill: "group" },
      orientation: "vertical",
      scales: {
        x: {},
        y: {},
        fill: { palette: ["#ff0000", "#00ff00", "#0000ff"] },
      },
    };

    test("assigns palette colors to datasets as backgroundColor", () => {
      const result = structureData(spec);
      expect(result.datasets[0].backgroundColor).toBe("#ff0000");
      expect(result.datasets[1].backgroundColor).toBe("#00ff00");
      expect(result.datasets[2].backgroundColor).toBe("#0000ff");
    });

    test("cycles palette when more groups than colors", () => {
      const specCycle = {
        ...spec,
        scales: {
          x: {},
          y: {},
          fill: { palette: ["#ff0000", "#00ff00"] },
        },
      };
      const result = structureData(specCycle);
      expect(result.datasets[0].backgroundColor).toBe("#ff0000");
      expect(result.datasets[1].backgroundColor).toBe("#00ff00");
      expect(result.datasets[2].backgroundColor).toBe("#ff0000");
    });

    test("does not set backgroundColor when no palette is provided", () => {
      const specNoPalette = {
        ...spec,
        scales: { x: {}, y: {} },
      };
      const result = structureData(specNoPalette);
      expect(result.datasets[0].backgroundColor).toBeUndefined();
    });

    test("does not set backgroundColor on single series without fill", () => {
      const specNoFill = {
        data: [{ site: "A", score: 10 }],
        mapping: { x: "site", y: "score" },
        orientation: "vertical",
        scales: {
          x: {},
          y: {},
          fill: { palette: ["#ff0000"] },
        },
      };
      const result = structureData(specNoFill);
      expect(result.datasets[0].backgroundColor).toBeUndefined();
    });
  });
});
