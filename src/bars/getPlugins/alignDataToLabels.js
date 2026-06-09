export default function alignDataToLabels(data, labels, catKey, valKey) {
    const pointByCategory = new Map(
        data.map((point) => [point[catKey], point])
    );

    return labels.map(
        (cat) =>
            pointByCategory.get(cat) || {
                [catKey]: cat,
                [valKey]: 0,
                _rawY: 0,
                _placeholder: true,
            }
    );
}
