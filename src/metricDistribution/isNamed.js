// A Reporting_Metrics label is missing when it is blank or 'NA'.
export default function isNamed(label) {
    return typeof label === 'string' && label.trim() !== '' && label !== 'NA';
}
