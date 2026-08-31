import buildTooltip from '../../src/points/buildTooltip.js';

const point = {
    x: 12,
    y: 4,
    _key: 'site-01',
    _color: 'Treatment',
    _datum: {
        site: 'Site 01',
        region: 'North America',
        participant: { id: 101 },
        note: null,
    },
};

function makeContext(raw = point) {
    return {
        raw,
        dataIndex: 0,
        datasetIndex: 0,
        dataset: {
            label: 'Treatment',
            data: [raw],
        },
    };
}

describe('points/buildTooltip', () => {
    test('forwards Chart.js options and strips gsm.viz-only fields', () => {
        const formatter = jest.fn();
        const result = buildTooltip({
            format: '{x}',
            formatter,
            enabled: false,
            mode: 'nearest',
            intersect: false,
            backgroundColor: '#112233',
        });

        expect(result.enabled).toBe(false);
        expect(result.mode).toBe('nearest');
        expect(result.intersect).toBe(false);
        expect(result.backgroundColor).toBe('#112233');
        expect(result.format).toBeUndefined();
        expect(result.formatter).toBeUndefined();
    });

    test('preserves a Chart.js label callback with highest precedence', () => {
        const label = jest.fn(() => 'Chart.js label');
        const formatter = jest.fn(() => 'formatter');
        const result = buildTooltip({
            callbacks: { label },
            formatter,
            format: '{x}',
        });
        const context = makeContext();

        expect(result.callbacks.label).toBe(label);
        expect(result.callbacks.label(context)).toBe('Chart.js label');
        expect(formatter).not.toHaveBeenCalled();
    });

    test('calls formatter with the point, context, and stable details', () => {
        const formatter = jest.fn(
            (_point, _context, details) =>
                `${details.datum.site}: ${details.x}, ${details.y}`
        );
        const context = makeContext();
        const result = buildTooltip({ formatter, format: '{site}' });

        expect(result.callbacks.label(context)).toBe('Site 01: 12, 4');
        expect(formatter).toHaveBeenCalledWith(point, context, {
            x: 12,
            y: 4,
            color: 'Treatment',
            key: 'site-01',
            datum: point._datum,
        });
    });

    test('interpolates structured, source, qualified, and nested fields', () => {
        const context = makeContext();
        const result = buildTooltip({
            format: '{site} ({key}): {y} at {x}, {color}, {datum.region}, {_datum.participant.id}, {note}',
        });

        expect(result.callbacks.label(context)).toBe(
            'Site 01 (site-01): 4 at 12, Treatment, North America, 101, '
        );
    });

    test('throws a descriptive error for an unresolved runtime placeholder', () => {
        const result = buildTooltip({ format: '{unknown}' });

        expect(() => result.callbacks.label(makeContext())).toThrow(
            'tooltip.format placeholder "{unknown}" could not be resolved'
        );
    });

    test('leaves the Chart.js default label callback in place by default', () => {
        const result = buildTooltip({
            callbacks: { title: () => 'Title' },
        });

        expect(result.callbacks.title()).toBe('Title');
        expect(result.callbacks.label).toBeUndefined();
    });

    test('does not mutate caller-owned callback configuration', () => {
        const callbacks = Object.freeze({
            title: () => 'Title',
        });
        const tooltip = Object.freeze({
            callbacks,
            format: '{x}',
        });

        const result = buildTooltip(tooltip);

        expect(result).not.toBe(tooltip);
        expect(result.callbacks).not.toBe(callbacks);
        expect(callbacks.label).toBeUndefined();
    });
});
