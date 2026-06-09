export default function clearDatasetMeta(chart, datasetIndex) {
    const meta = chart.getDatasetMeta?.(datasetIndex);

    if (meta) {
        meta._parsed = [];
        meta._sorted = true;
    }
}
