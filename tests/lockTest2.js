/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { attainLock, releaseLock } from '../functions/locksupportive.js';
/* eslint-enable import/extensions */

let counter = 0;
const endTime = Date.now() + 30 * 60 * 1000; // 30 minutes from now
let previousTime = Date.now();

const intervalId = setInterval(() => {
    if (Date.now() > endTime) {
        clearInterval(intervalId); // Stop the loop after 30 minutes
        return;
    }

    if (counter % 2 === 0) {
        // Even interval
        process.stdout.write('Performing operation attainLock: ');
        attainLock(config.processingBookmarkPathWithoutSync, 5000, true);
    } else {
        // Odd interval
        process.stdout.write('Performing operation releaseLock: ');
        releaseLock(config.processingBookmarkPathWithoutSync, 5000, true);
        // Put your code for operation X here
    }
    const currentTime = Date.now();
    let difference = (currentTime - previousTime) / 1000; // Convert to seconds
    difference = difference.toFixed(2);
    console.log(`${difference} seconds`);

    counter++;
    previousTime = currentTime;
}, 5000); // Repeat every 5 seconds
