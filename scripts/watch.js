const esbuild = require('esbuild');
const syncBundles = require('./sync-bundles');

esbuild
    .context({
        entryPoints: ['src/main.js'],
        bundle: true,
        globalName: 'gsmViz',
        outfile: 'index.js',
        sourcemap: true,
        banner: { js: "'use strict'" },
        plugins: [
            {
                name: 'sync-bundles',
                setup(build) {
                    build.onEnd((result) => {
                        if (result.errors.length === 0) {
                            syncBundles();
                            console.log('[sync] examples/index.js updated');
                        }
                    });
                },
            },
        ],
    })
    .then((ctx) => ctx.watch());
