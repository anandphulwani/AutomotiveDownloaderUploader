/* eslint-disable import/no-cycle */
import { lgd } from './loggerandlocksupportive';
/* eslint-enable import/no-cycle */

function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function sleep(n) {
    msleep(n * 1000);
}

async function waitForSeconds(seconds, debug = false) {
    debug ? process.stdout.write(`Waiting start for ${seconds} seconds: Executing.  `) : '';
    for (let cnt = 0; cnt < seconds; cnt++) {
        debug ? process.stdout.write('.') : '';
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1 * 1000));
    }
    debug ? lgd(`Waiting start for ${seconds} seconds: Done.`) : null;
}

async function waitForMilliSeconds(milliseconds, debug = false) {
    debug ? process.stdout.write(`Waiting start for ${milliseconds} milliseconds: Executing.  `) : '';
    for (let cnt = 0; cnt < milliseconds; cnt++) {
        debug ? process.stdout.write('.') : '';
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1));
    }
    debug ? lgd(`Waiting start for ${milliseconds} milliseconds: Done.`) : null;
}

export { msleep, sleep, waitForSeconds, waitForMilliSeconds };
