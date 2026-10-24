/**
 * @jest-environment jsdom
 */

import tiles from '../../src/tiles.js';
import { makeData, makeSpec } from './fixtures.js';

const header = (el, x) =>
    [...el.querySelectorAll('.gsm-tiles-col-header')].find(
        (th) => th.title === x
    );
const rowHeader = (el, y) =>
    [...el.querySelectorAll('.gsm-tiles-row-header')].find(
        (th) => th.textContent === y
    );
const key = (node, k) =>
    node.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('tiles interaction', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('expand / collapse', () => {
        test('only columns with detail data are expandable', () => {
            tiles(el, makeData(), makeSpec());
            const weight = header(el, 'Weight');
            expect(weight.textContent).toBe('Weight ▸');
            expect(weight.getAttribute('role')).toBe('button');
            expect(weight.getAttribute('tabindex')).toBe('0');
            expect(weight.getAttribute('aria-expanded')).toBe('false');
            expect(header(el, 'Pulse').textContent).toBe('Pulse');
            expect(
                header(el, 'Pulse').classList.contains('gsm-tiles-toggle')
            ).toBe(false);
        });

        test('header click expands in place and calls onExpand', () => {
            const onExpand = jest.fn();
            const chart = tiles(
                el,
                makeData(),
                makeSpec({ callbacks: { onExpand } })
            );
            header(el, 'Weight').click();
            const weight = header(el, 'Weight');
            expect(weight.textContent).toBe('Weight ▾');
            expect(weight.colSpan).toBe(3);
            expect(weight.getAttribute('aria-expanded')).toBe('true');
            expect(
                [...el.querySelectorAll('.gsm-tiles-subheader')].map(
                    (th) => th.textContent
                )
            ).toEqual(['1', '2', '10']);
            expect(header(el, 'Pulse').rowSpan).toBe(2);
            expect(el.querySelector('.gsm-tiles-corner').rowSpan).toBe(2);
            // 3 detail + 1 pulse cell per row.
            const s1 = el.querySelectorAll('tbody tr')[0];
            expect(s1.querySelectorAll('td')).toHaveLength(4);
            const details = s1.querySelectorAll('td.gsm-tiles-detail');
            expect([...details].map((td) => td.textContent)).toEqual([
                '',
                '71',
                '70',
            ]);
            expect(details[0].classList.contains('gsm-tiles-missing')).toBe(
                true
            );
            expect(details[2].style.backgroundColor).toBe('rgb(0, 0, 0)');
            expect(details[2].style.color).toBe('rgb(255, 255, 255)');
            expect(details[2].title).toBe('S1 · Weight 10: 70');
            expect(onExpand).toHaveBeenCalledWith('Weight', true);
            expect(chart.helpers.getState(chart).expanded).toEqual(['Weight']);

            header(el, 'Weight').click();
            expect(header(el, 'Weight').textContent).toBe('Weight ▸');
            expect(el.querySelector('.gsm-tiles-subheader')).toBeNull();
            expect(onExpand).toHaveBeenLastCalledWith('Weight', false);
        });

        test('Enter and Space toggle the header', () => {
            tiles(el, makeData(), makeSpec());
            key(header(el, 'Weight'), 'Enter');
            expect(header(el, 'Weight').textContent).toBe('Weight ▾');
            expect(document.activeElement).toBe(header(el, 'Weight'));
            key(header(el, 'Weight'), ' ');
            expect(header(el, 'Weight').textContent).toBe('Weight ▸');
            key(header(el, 'Weight'), 'a');
            expect(header(el, 'Weight').textContent).toBe('Weight ▸');
        });

        test('helpers toggle, call onExpand and ignore no-ops', () => {
            const onExpand = jest.fn();
            const chart = tiles(
                el,
                makeData(),
                makeSpec({ callbacks: { onExpand } })
            );
            const { expandColumn, collapseColumn } = chart.helpers;
            expect(expandColumn(chart, 'Weight')).toBe(true);
            expect(expandColumn(chart, 'Weight')).toBe(false);
            expect(expandColumn(chart, 'Pulse')).toBe(false);
            expect(expandColumn(chart, 'Nope')).toBe(false);
            expect(el.querySelectorAll('.gsm-tiles-subheader')).toHaveLength(3);
            expect(collapseColumn(chart, 'Weight')).toBe(true);
            expect(collapseColumn(chart, 'Weight')).toBe(false);
            expect(onExpand.mock.calls).toEqual([
                ['Weight', true],
                ['Weight', false],
            ]);
        });

        test('expand.initial expands at first render without onExpand', () => {
            const onExpand = jest.fn();
            const spec = makeSpec({ callbacks: { onExpand } });
            spec.expand.initial = ['Weight', 'Pulse'];
            const chart = tiles(el, makeData(), spec);
            expect(chart.helpers.getState(chart).expanded).toEqual(['Weight']);
            expect(header(el, 'Weight').textContent).toBe('Weight ▾');
            expect(onExpand).not.toHaveBeenCalled();
        });

        test('expanded legend appears only while a column is expanded', () => {
            const chart = tiles(el, makeData(), makeSpec());
            expect(el.querySelectorAll('.gsm-tiles-legend-group')).toHaveLength(
                1
            );
            chart.helpers.expandColumn(chart, 'Weight');
            const groups = el.querySelectorAll('.gsm-tiles-legend-group');
            expect(groups).toHaveLength(2);
            expect(groups[1].textContent).toBe('In windowtruefalse');
        });
    });

    describe('callbacks', () => {
        test('onClick receives compact and detail source rows', () => {
            const onClick = jest.fn();
            const data = makeData();
            const spec = makeSpec({ callbacks: { onClick } });
            const chart = tiles(el, data, spec);
            el.querySelector('tbody td').click();
            expect(onClick.mock.calls[0][0]).toBe(data[0]);
            expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);

            chart.helpers.expandColumn(chart, 'Weight');
            el.querySelectorAll('tbody tr')[0]
                .querySelectorAll('td.gsm-tiles-detail')[2]
                .click();
            expect(onClick.mock.calls[1][0]).toBe(spec.expand.data[0]);

            el.querySelector('td.gsm-tiles-missing').click();
            expect(onClick).toHaveBeenCalledTimes(2);
        });

        test('onRowClick payload; does not select or expand', () => {
            const onRowClick = jest.fn();
            const onExpand = jest.fn();
            const data = makeData();
            const chart = tiles(
                el,
                data,
                makeSpec({ callbacks: { onRowClick, onExpand } })
            );
            rowHeader(el, 'S1').click();
            expect(onRowClick).toHaveBeenCalledWith(
                { y: 'S1', rows: [data[0], data[1]] },
                expect.any(MouseEvent)
            );
            key(rowHeader(el, 'S2'), 'Enter');
            expect(onRowClick.mock.calls[1][0]).toEqual({
                y: 'S2',
                rows: [data[2]],
            });
            expect(chart.helpers.getState(chart)).toEqual({
                expanded: [],
                selected: null,
                page: 1,
            });
            expect(el.querySelector('.gsm-tiles-selected')).toBeNull();
            expect(onExpand).not.toHaveBeenCalled();
        });
    });

    describe('selection', () => {
        test('selectRow marks one row; clearSelection removes it', () => {
            const onRowClick = jest.fn();
            const chart = tiles(
                el,
                makeData(),
                makeSpec({ callbacks: { onRowClick } })
            );
            const { selectRow, clearSelection, getState } = chart.helpers;
            expect(selectRow(chart, 'S2')).toBe(true);
            let selected = el.querySelectorAll('tr.gsm-tiles-selected');
            expect(selected).toHaveLength(1);
            expect(selected[0].firstChild.textContent).toBe('S2');
            selectRow(chart, 'S1');
            selected = el.querySelectorAll('tr.gsm-tiles-selected');
            expect(selected).toHaveLength(1);
            expect(selected[0].firstChild.textContent).toBe('S1');
            expect(getState(chart).selected).toBe('S1');
            clearSelection(chart);
            expect(el.querySelector('.gsm-tiles-selected')).toBeNull();
            expect(getState(chart).selected).toBeNull();
            expect(selectRow(chart, 'missing')).toBe(false);
            expect(onRowClick).not.toHaveBeenCalled();
        });
    });

    describe('paging', () => {
        const manyRows = (n) =>
            Array.from({ length: n }, (_, i) => ({
                subjid: `P${String(i + 1).padStart(3, '0')}`,
                vital: 'Weight',
                flag: 'Green',
                rate: '0%',
            }));
        const spec = () =>
            makeSpec({
                expand: undefined,
                rows: { pageSize: 50 },
            });

        test('renders a pager and pages with next/prev', () => {
            const chart = tiles(el, manyRows(120), spec());
            const text = () =>
                el.querySelector('.gsm-tiles-pager-text').textContent;
            expect(el.querySelectorAll('tbody tr')).toHaveLength(50);
            expect(text()).toBe('Rows 1–50 of 120');
            expect(el.querySelector('.gsm-tiles-prev').disabled).toBe(true);
            el.querySelector('.gsm-tiles-next').click();
            el.querySelector('.gsm-tiles-next').click();
            expect(text()).toBe('Rows 101–120 of 120');
            expect(el.querySelectorAll('tbody tr')).toHaveLength(20);
            expect(el.querySelector('.gsm-tiles-next').disabled).toBe(true);
            el.querySelector('.gsm-tiles-prev').click();
            expect(text()).toBe('Rows 51–100 of 120');
            expect(chart.helpers.getState(chart).page).toBe(2);
        });

        test('no pager when rows fit on one page', () => {
            tiles(el, manyRows(50), spec());
            expect(el.querySelector('.gsm-tiles-pager')).toBeNull();
        });

        test('selectRow jumps to the page of the row', () => {
            const chart = tiles(el, manyRows(120), spec());
            chart.helpers.selectRow(chart, 'P105');
            expect(chart.helpers.getState(chart).page).toBe(3);
            expect(
                el.querySelector('tr.gsm-tiles-selected').firstChild.textContent
            ).toBe('P105');
        });

        test('updateData resets to page 1', () => {
            const chart = tiles(el, manyRows(120), spec());
            el.querySelector('.gsm-tiles-next').click();
            chart.helpers.updateData(chart, manyRows(110));
            expect(chart.helpers.getState(chart).page).toBe(1);
            expect(el.querySelector('.gsm-tiles-pager-text').textContent).toBe(
                'Rows 1–50 of 110'
            );
        });
    });

    describe('updates', () => {
        test('updateData keeps expansion and selection that still exist', () => {
            const chart = tiles(el, makeData(), makeSpec());
            const { updateData, expandColumn, selectRow, getState } =
                chart.helpers;
            expandColumn(chart, 'Weight');
            selectRow(chart, 'S2');
            const next = makeData().filter((d) => d.subjid !== 'S3');
            updateData(chart, next);
            expect(chart.data).toBe(next);
            expect(getState(chart)).toEqual({
                expanded: ['Weight'],
                selected: 'S2',
                page: 1,
            });
            expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
            expect(el.querySelector('tr.gsm-tiles-selected')).not.toBeNull();

            updateData(
                chart,
                makeData().filter((d) => d.subjid === 'S1')
            );
            expect(getState(chart).selected).toBeNull();
        });

        test('updateData with a spec merges it like a first render', () => {
            const chart = tiles(el, makeData(), makeSpec());
            chart.helpers.expandColumn(chart, 'Weight');
            chart.helpers.updateData(chart, makeData(), {
                mapping: { x: 'vital', y: 'subjid', label: 'nd' },
            });
            expect(chart.spec.theme.cellWidth).toBe(64);
            expect(chart.spec.expand).toBeNull();
            expect(chart.helpers.getState(chart).expanded).toEqual([]);
            expect(el.querySelector('tbody td').textContent).toBe('1/2');
            expect(() =>
                chart.helpers.updateData(chart, [{ vital: 'Weight' }])
            ).toThrow('tiles: data[0] is missing field "subjid"');
        });

        test('updateSpec switches label and order, keeping state', () => {
            const chart = tiles(
                el,
                makeData(),
                makeSpec({ rows: { pageSize: 2 } })
            );
            const { updateSpec, expandColumn, selectRow, getState } =
                chart.helpers;
            expandColumn(chart, 'Weight');
            selectRow(chart, 'S3');
            updateSpec(chart, {
                mapping: { label: 'nd' },
                scales: { y: { order: ['S3', 'S2', 'S1'] } },
            });
            expect(chart.spec.mapping).toEqual({
                x: 'vital',
                y: 'subjid',
                fill: 'flag',
                label: 'nd',
            });
            expect(chart.spec.scales.fill.colors.Red).toBe('#ff0000');
            expect(getState(chart)).toEqual({
                expanded: ['Weight'],
                selected: 'S3',
                page: 2,
            });
            expect(
                [...el.querySelectorAll('.gsm-tiles-row-header')].map(
                    (th) => th.textContent
                )
            ).toEqual(['S1']);
            expect(el.querySelector('tbody tr td:last-child').textContent).toBe(
                '0/3'
            );
            expect(header(el, 'Weight').textContent).toBe('Weight ▾');
        });
    });
});
