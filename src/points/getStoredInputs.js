export default function getStoredInputs(chart) {
    const { data, ...spec } = chart.data._spec_;
    return { data, spec };
}
