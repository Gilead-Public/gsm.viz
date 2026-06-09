export default function getAllLabels(chart, visibleCats) {
    return chart.data._allLabels_ || [...visibleCats];
}
