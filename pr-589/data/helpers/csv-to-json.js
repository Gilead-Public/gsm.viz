//jshint esversion:8
//jshint node:true
//
// Run from project root.
const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const dataDir = 'examples/data';

// Make an async function that gets executed immediately
(async () => {
    // Our starting point
    try {
        // Get the files as an array
        const files = await fs.promises.readdir(dataDir);

        // Loop them all with the new for...of
        for (const File of files) {
            if (/csv$/.test(File)) {
                const filePath = `${dataDir}/${File}`;
                console.log(filePath);
                csv()
                    .fromFile(filePath)
                    .then((data) => {
                        fs.writeFileSync(
                            filePath.replace(/csv$/, 'json'),
                            JSON.stringify(data, null, '\t')
                        );
                    });
            }
        } // End for...of
    } catch (e) {
        // Catch anything bad that happens
        console.error("We've thrown! Whoops!", e);
    }
})(); // Wrap in parenthesis and call now
