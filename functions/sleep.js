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
    debug ? console.log(`\nWaiting start for ${seconds} seconds: Done.`) : '';
}

export { msleep, sleep, waitForSeconds };
