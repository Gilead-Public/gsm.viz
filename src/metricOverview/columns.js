import resultsSchema from '../data/schema/results.json';

// The Reporting_Results contract is the one source of column names and fallback labels.
export const resultsColumns = resultsSchema.items.required;

export const columnTitle = (column) =>
    resultsSchema.items.properties[column].title;
