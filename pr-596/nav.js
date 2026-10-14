/**
 * Shared navigation sidebar for gsm.viz example pages.
 *
 * Include this script in any example page and it will inject a collapsible
 * left-hand sidebar listing all examples and API reference pages.
 *
 * Usage (depth-1 pages, e.g. examples/scatterPlot/):
 *   <script src="../nav.js"></script>
 *
 * Usage (depth-2 pages, e.g. examples/groupOverview/site/):
 *   <script src="../../nav.js"></script>
 */
(function () {
    // Resolve path back to the examples root by stripping "nav.js" from the
    // literal src attribute (e.g. "../nav.js" → "../", "../../nav.js" → "../../").
    const src = document.currentScript.getAttribute('src') || '../nav.js';
    const root = src.replace('nav.js', '');

    const exampleGroups = [
        {
            label: 'Generics',
            items: [
                { label: 'Bar Chart', href: root + 'bars/' },
                { label: 'Bar Chart Builder', href: root + 'bars/builder.html' },
                { label: 'Points', href: root + 'points/' },
            ],
        },
        {
            label: 'Metrics',
            items: [
                { label: 'Bar Chart', href: root + 'barChart/' },
                { label: 'Group Overview — Country', href: root + 'groupOverview/country/' },
                { label: 'Group Overview — Site', href: root + 'groupOverview/site/' },
                { label: 'Scatter Plot', href: root + 'scatterPlot/' },
                { label: 'Sparkline', href: root + 'sparkline/' },
                { label: 'Time Series', href: root + 'timeSeriesContinuous/' },
                { label: 'Time Series (with CI)', href: root + 'timeSeriesWithCI/' },
            ],
        },
    ];

    const apiGroups = [
        {
            label: 'Generics',
            items: [
                { label: 'bars', href: root + '#/docs/bars' },
                { label: 'points', href: root + '#/docs/points' },
            ],
        },
        {
            label: 'Metrics',
            items: [
                { label: 'barChart', href: root + '#/docs/barChart' },
                { label: 'groupOverview', href: root + '#/docs/groupOverview' },
                { label: 'scatterPlot', href: root + '#/docs/scatterPlot' },
                { label: 'sparkline', href: root + '#/docs/sparkline' },
                { label: 'timeSeries', href: root + '#/docs/timeSeries' },
            ],
        },
    ];

    function buildLinks(items) {
        return items
            .map(function (item) {
                const isCurrent = location.href.includes(item.href.replace(/^(\.\.\/)+/, ''));
                return (
                    '<a href="' +
                    item.href +
                    '"' +
                    (isCurrent ? ' class="gsm-nav__link--active"' : '') +
                    '>' +
                    item.label +
                    '</a>'
                );
            })
            .join('');
    }

    function buildGroupedSection(groups) {
        return groups
            .map(function (group) {
                return (
                    '<span class="gsm-nav__sublabel">' +
                    group.label +
                    '</span>' +
                    buildLinks(group.items)
                );
            })
            .join('');
    }

    const styles = `
        .gsm-nav {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            width: 220px;
            background: #f6f8fa;
            border-right: 1px solid #d0d7de;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 13px;
            z-index: 1000;
            transform: translateX(-220px);
            transition: transform 0.2s ease;
            overflow-y: auto;
        }
        .gsm-nav.gsm-nav--open {
            transform: translateX(0);
        }
        .gsm-nav__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 12px 8px;
            border-bottom: 1px solid #d0d7de;
            flex-shrink: 0;
        }
        .gsm-nav__home {
            font-weight: 700;
            font-size: 15px;
            color: #0969da;
            text-decoration: none;
        }
        .gsm-nav__home:hover { text-decoration: underline; }
        .gsm-nav__close {
            background: none;
            border: none;
            cursor: pointer;
            color: #57606a;
            font-size: 18px;
            line-height: 1;
            padding: 2px 4px;
        }
        .gsm-nav__close:hover { color: #0969da; }
        .gsm-nav__section {
            padding: 10px 0 4px;
        }
        .gsm-nav__label {
            display: block;
            padding: 2px 12px 6px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #57606a;
        }
        .gsm-nav__sublabel {
            display: block;
            padding: 6px 12px 2px 12px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #8c959f;
        }
        .gsm-nav a {
            display: block;
            padding: 5px 12px 5px 20px;
            color: #24292f;
            text-decoration: none;
            border-left: 2px solid transparent;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .gsm-nav a:hover {
            background: #eaeef2;
            color: #0969da;
        }
        .gsm-nav__link--active {
            color: #0969da !important;
            border-left-color: #0969da !important;
            font-weight: 600;
            background: #dbeafe;
        }
        .gsm-nav__toggle {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 1001;
            background: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            cursor: pointer;
            padding: 5px 8px;
            font-size: 16px;
            color: #24292f;
            line-height: 1;
            transition: left 0.2s ease;
        }
        .gsm-nav__toggle:hover { background: #eaeef2; color: #0969da; }
        .gsm-nav__toggle--open { left: 228px; }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    const nav = document.createElement('aside');
    nav.className = 'gsm-nav';
    nav.setAttribute('aria-label', 'Site navigation');
    nav.innerHTML =
        '<div class="gsm-nav__header">' +
        '  <a class="gsm-nav__home" href="' + root + '">gsm.viz</a>' +
        '  <button class="gsm-nav__close" aria-label="Close navigation" title="Close">✕</button>' +
        '</div>' +
        '<div class="gsm-nav__section">' +
        '  <span class="gsm-nav__label">Examples</span>' +
        buildGroupedSection(exampleGroups) +
        '</div>' +
        '<div class="gsm-nav__section">' +
        '  <span class="gsm-nav__label">API Reference</span>' +
        buildGroupedSection(apiGroups) +
        '</div>';

    const toggle = document.createElement('button');
    toggle.className = 'gsm-nav__toggle';
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.setAttribute('title', 'Toggle navigation');
    toggle.textContent = '☰';

    function open() {
        nav.classList.add('gsm-nav--open');
        toggle.classList.add('gsm-nav__toggle--open');
        toggle.setAttribute('aria-label', 'Close navigation');
    }

    function close() {
        nav.classList.remove('gsm-nav--open');
        toggle.classList.remove('gsm-nav__toggle--open');
        toggle.setAttribute('aria-label', 'Open navigation');
    }

    toggle.addEventListener('click', function () {
        nav.classList.contains('gsm-nav--open') ? close() : open();
    });

    nav.querySelector('.gsm-nav__close').addEventListener('click', close);

    document.body.appendChild(nav);
    document.body.appendChild(toggle);
})();
