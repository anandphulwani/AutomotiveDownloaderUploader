function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function sleep(n) {
    msleep(n * 1000);
}

async function waitForSeconds(seconds, debug = false) {
    debug ? process.stdout.write(`Waiting start for ${seconds} seconds: Executing.  `) : '';
    for (let cnt = 0; cnt < seconds; cnt++) {
        /**
         * Cannot change below to lgi function as it creates cyclic dependency problem.
         */
        debug ? process.stdout.write('.') : '';
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1 * 1000));
    }
    /**
     * Cannot change below to lgi function as it creates cyclic dependency problem.
     */
    debug ? console.log(`Waiting start for ${seconds} seconds: Done.`) : null;
}

async function waitForMilliSeconds(milliseconds, debug = false) {
    debug ? process.stdout.write(`Waiting start for ${milliseconds} milliseconds: Executing.  `) : '';
    const startingTime = Date.now();
    for (let cnt = 0; cnt < milliseconds && Date.now() - startingTime < milliseconds; cnt++) {
        /**
         * Cannot change below to lgi function as it creates cyclic dependency problem.
         */
        debug ? process.stdout.write('.') : '';
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1));
    }
    /**
     * Cannot change below to lgi function as it creates cyclic dependency problem.
     */
    debug ? console.log(`Waiting start for ${milliseconds} milliseconds: Done.`) : null;
}

export { msleep, sleep, waitForSeconds, waitForMilliSeconds };
