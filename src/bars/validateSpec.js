/**
 * Validate the bars spec object.
 *
 * @param {Object} spec - the chart specification
 * @throws {Error} if required fields are missing or invalid
 */
export default function validateSpec(spec) {
  if (spec === undefined || spec === null) {
    throw new Error("spec is required");
  }

  if (typeof spec !== "object" || Array.isArray(spec)) {
    throw new Error("spec must be a plain object");
  }

  if (!spec.data) {
    throw new Error("spec.data is required");
  }

  if (!Array.isArray(spec.data)) {
    throw new Error("spec.data must be an array");
  }

  if (!spec.mapping) {
    throw new Error("spec.mapping is required");
  }

  if (!spec.mapping.x) {
    throw new Error("spec.mapping.x is required");
  }

  if (!spec.mapping.y) {
    throw new Error("spec.mapping.y is required");
  }

  if (
    spec.orientation !== undefined &&
    spec.orientation !== "vertical" &&
    spec.orientation !== "horizontal"
  ) {
    throw new Error("spec.orientation must be 'vertical' or 'horizontal'");
  }
}
