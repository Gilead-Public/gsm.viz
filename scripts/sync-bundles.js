const fs = require('fs');
const path = require('path');

const artifacts = ['index.js', 'index.js.map'];

function syncBundles({ rootDir = process.cwd() } = {}) {
    const examplesDir = path.join(rootDir, 'examples');

    fs.mkdirSync(examplesDir, { recursive: true });

    artifacts.forEach((artifact) => {
        const source = path.join(rootDir, artifact);
        const destination = path.join(examplesDir, artifact);

        if (!fs.existsSync(source)) {
            throw new Error(`Missing bundle artifact: ${artifact}`);
        }

        fs.rmSync(destination, { force: true });
        fs.copyFileSync(source, destination);
    });
}

if (require.main === module) {
    syncBundles();
}

module.exports = syncBundles;
