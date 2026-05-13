import validateSpec from "../../src/bars/validateSpec.js";

describe("bars/validateSpec", () => {
  test("throws when spec is not provided", () => {
    expect(() => validateSpec()).toThrow("spec is required");
  });

  test("throws when spec is not an object", () => {
    expect(() => validateSpec("string")).toThrow("spec must be a plain object");
  });

  test("throws when data is missing", () => {
    expect(() => validateSpec({ mapping: { x: "a", y: "b" } })).toThrow(
      "spec.data is required"
    );
  });

  test("throws when data is not an array", () => {
    expect(() =>
      validateSpec({ data: "not-array", mapping: { x: "a", y: "b" } })
    ).toThrow("spec.data must be an array");
  });

  test("throws when mapping is missing", () => {
    expect(() => validateSpec({ data: [] })).toThrow(
      "spec.mapping is required"
    );
  });

  test("throws when mapping.x is missing", () => {
    expect(() => validateSpec({ data: [], mapping: { y: "b" } })).toThrow(
      "spec.mapping.x is required"
    );
  });

  test("throws when mapping.y is missing", () => {
    expect(() => validateSpec({ data: [], mapping: { x: "a" } })).toThrow(
      "spec.mapping.y is required"
    );
  });

  test("throws when orientation is invalid", () => {
    expect(() =>
      validateSpec({
        data: [],
        mapping: { x: "a", y: "b" },
        orientation: "diagonal",
      })
    ).toThrow("spec.orientation must be 'vertical' or 'horizontal'");
  });

  test("does not throw with a valid minimal spec", () => {
    expect(() =>
      validateSpec({ data: [], mapping: { x: "a", y: "b" } })
    ).not.toThrow();
  });

  test("does not throw with a full valid spec", () => {
    expect(() =>
      validateSpec({
        data: [{ a: 1, b: 2 }],
        mapping: { x: "a", y: "b", fill: "group" },
        orientation: "horizontal",
        scales: { x: { label: "X" } },
        labels: { title: "Test" },
        theme: { maintainAspectRatio: false },
      })
    ).not.toThrow();
  });
});
