export const vitals = ['Weight', 'Pulse'];

export function makeData() {
    return [
        { subjid: 'S1', vital: 'Weight', flag: 'Red', rate: '50%', nd: '1/2' },
        { subjid: 'S1', vital: 'Pulse', flag: 'Green', rate: '0%', nd: '0/3' },
        {
            subjid: 'S2',
            vital: 'Weight',
            flag: 'Amber',
            rate: '25%',
            nd: '1/4',
        },
        { subjid: 'S3', vital: 'Pulse', flag: 'Odd', rate: '10%', nd: '1/10' },
    ];
}

export function makeDetail() {
    return [
        { subjid: 'S1', vital: 'Weight', seq: 10, inWindow: true, value: 70 },
        { subjid: 'S1', vital: 'Weight', seq: 2, inWindow: false, value: 71 },
        { subjid: 'S2', vital: 'Weight', seq: 1, inWindow: true, value: 80 },
    ];
}

export function makeSpec(extra = {}) {
    return {
        mapping: { x: 'vital', y: 'subjid', fill: 'flag', label: 'rate' },
        scales: {
            fill: {
                colors: { Green: '#3daf06', Amber: '#feaa02', Red: '#ff0000' },
                label: 'Flag',
            },
        },
        expand: {
            data: makeDetail(),
            mapping: { x: 'seq', fill: 'inWindow', label: 'value' },
            scales: {
                fill: {
                    colors: { true: '#000000', false: '#ffffff' },
                    label: 'In window',
                },
            },
        },
        ...extra,
    };
}
