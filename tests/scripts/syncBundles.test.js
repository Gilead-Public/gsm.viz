import fs from 'fs';
import os from 'os';
import path from 'path';
import syncBundles from '../../scripts/sync-bundles.js';

describe('scripts/sync-bundles', () => {
    let rootDir;

    beforeEach(() => {
        rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-viz-sync-'));
        fs.mkdirSync(path.join(rootDir, 'examples'));
    });

    afterEach(() => {
        fs.rmSync(rootDir, { recursive: true, force: true });
    });

    test('copies bundle artifacts into examples', () => {
        fs.writeFileSync(path.join(rootDir, 'index.js'), 'bundle');
        fs.writeFileSync(path.join(rootDir, 'index.js.map'), 'sourcemap');

        syncBundles({ rootDir });

        expect(
            fs.readFileSync(path.join(rootDir, 'examples', 'index.js'), 'utf8')
        ).toBe('bundle');
        expect(
            fs.readFileSync(
                path.join(rootDir, 'examples', 'index.js.map'),
                'utf8'
            )
        ).toBe('sourcemap');
    });

    test('replaces stale destination artifacts', () => {
        fs.writeFileSync(path.join(rootDir, 'index.js'), 'new bundle');
        fs.writeFileSync(path.join(rootDir, 'index.js.map'), 'new sourcemap');
        fs.writeFileSync(path.join(rootDir, 'examples', 'index.js'), 'old');
        fs.writeFileSync(path.join(rootDir, 'examples', 'index.js.map'), 'old');

        syncBundles({ rootDir });

        expect(
            fs.readFileSync(path.join(rootDir, 'examples', 'index.js'), 'utf8')
        ).toBe('new bundle');
        expect(
            fs.readFileSync(
                path.join(rootDir, 'examples', 'index.js.map'),
                'utf8'
            )
        ).toBe('new sourcemap');
    });

    test('throws when a source artifact is missing', () => {
        fs.writeFileSync(path.join(rootDir, 'index.js'), 'bundle');

        expect(() => syncBundles({ rootDir })).toThrow(
            'Missing bundle artifact: index.js.map'
        );
    });
});
