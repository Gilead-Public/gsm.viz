import truncateLabel from '../../src/bars/truncateLabel.js';

describe('bars/truncateLabel', () => {
    test('returns the label unchanged when shorter than maxLength', () => {
        expect(truncateLabel('Short', 10)).toBe('Short');
    });

    test('returns the label unchanged when exactly maxLength', () => {
        expect(truncateLabel('12345', 5)).toBe('12345');
    });

    test('truncates and appends ellipsis when label exceeds maxLength', () => {
        expect(truncateLabel('LongLabelText', 8)).toBe('LongLab…');
    });

    test('maxLength of 1 returns single ellipsis for long labels', () => {
        expect(truncateLabel('Hello', 1)).toBe('…');
    });

    test('handles empty string', () => {
        expect(truncateLabel('', 10)).toBe('');
    });

    test('handles null label gracefully', () => {
        expect(truncateLabel(null, 10)).toBe('');
    });

    test('handles undefined label gracefully', () => {
        expect(truncateLabel(undefined, 10)).toBe('');
    });

    test('handles numeric labels by converting to string', () => {
        expect(truncateLabel(12345678, 5)).toBe('1234…');
    });

    test('does not truncate when maxLength is undefined', () => {
        expect(truncateLabel('LongLabelText', undefined)).toBe('LongLabelText');
    });

    test('does not truncate when maxLength is null', () => {
        expect(truncateLabel('LongLabelText', null)).toBe('LongLabelText');
    });

    test('does not truncate when maxLength is 0', () => {
        expect(truncateLabel('LongLabelText', 0)).toBe('LongLabelText');
    });
});
