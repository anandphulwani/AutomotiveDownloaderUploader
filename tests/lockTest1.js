/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { attainLock, releaseLock } from '../functions/loggerandlocksupportive.js';
import { waitForSeconds } from '../functions/sleep.js';
/* eslint-enable import/extensions */

let counter = 0;
let previousTime = Date.now();

function lockChecker() {
    if (counter % 2 === 0) {
        process.stdout.write('Performing operation attainLock: ');
        attainLock(`../${config.processingBookmarksWithoutSyncFilePath}`, 10000, true);
    } else {
        process.stdout.write('Performing operation releaseLock: ');
        releaseLock(`../${config.processingBookmarksWithoutSyncFilePath}`, 10000, true);
    }
    const currentTime = Date.now();
    let difference = (currentTime - previousTime) / 1000;
    difference = difference.toFixed(2);
    console.log(`${difference} seconds`);
    counter++;
    previousTime = currentTime;
}

function processAndDelay() {
    lockChecker();
    setTimeout(processAndDelay, 60000);
}

await waitForSeconds(10);
processAndDelay();
