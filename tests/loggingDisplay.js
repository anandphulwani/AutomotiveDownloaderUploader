/* eslint-disable import/extensions */
import chalk from 'chalk';
import { config } from '../configs/config.js';
import { lgu, lgc, lge, lgw, lgi, lgv, lgd, lgb, lgs, lgh, lgt } from '../functions/loggersupportive.js';
import { sleep, waitForMilliSeconds } from '../functions/sleep.js';
import { getColPosOnTerminal } from '../functions/terminal.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
/* eslint-enable import/extensions */

const errorToTest = new Error('Error to be test here!');

lge('Logging message 01');
lge('Logging message 02', LineSeparator.true);
lge('Logging message 03', LineSeparator.true, new Error('Error to be test 03'));
lge('Logging message 04', new Error('Error to be test 04'));
lge('Logging message 05', new Error('Error to be test 05'), LineSeparator.true);
lge(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lge('Logging message 02', LineSeparator.false);
lge('Logging message 03', LineSeparator.false, new Error('Error to be test 03'));
lge('Logging message 05', new Error('Error to be test 05'), LineSeparator.false);
lge(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lge('Logging message 01');
lge('Logging message 02', LineSeparator.false);
lge('Logging message 03', LineSeparator.false, new Error('Error to be test 03'));
lge('Logging message 04', new Error('Error to be test 04'));
lge('Logging message 05', new Error('Error to be test 05'), LineSeparator.false);
lge(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgc('Logging message 01');
lgc('Logging message 02', LineSeparator.true);
lgc('Logging message 03', LineSeparator.true, new Error('Error to be test 03'));
lgc('Logging message 04', new Error('Error to be test 04'));
lgc('Logging message 05', new Error('Error to be test 05'), LineSeparator.true);
lgc(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgc('Logging message 02', LineSeparator.false);
lgc('Logging message 03', LineSeparator.false, new Error('Error to be test 03'));
lgc('Logging message 05', new Error('Error to be test 05'), LineSeparator.false);
lgc(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgc('Logging message 01');
lgc('Logging message 02', LineSeparator.false);
lgc('Logging message 03', LineSeparator.false, new Error('Error to be test 03'));
lgc('Logging message 04', new Error('Error to be test 04'));
lgc('Logging message 05', new Error('Error to be test 05'), LineSeparator.false);
lgc(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', errorToTest);
lgc('Logging catched error message', errorToTest);
lge('Logging error message', errorToTest);
lgh('Logging hiccup message');
lgw('Logging warning message');
lgi('Logging info message');
lgv('Logging verbose message');
lgd('Logging debug message');
lgt('Logging trace message');
lgb('Logging billy message');
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', errorToTest, LineSeparator.false);
lgc('Logging catched error message', errorToTest, LineSeparator.false);
lgs('Logging severe message', errorToTest, LineSeparator.false);
lge('Logging error message', errorToTest, LineSeparator.false);
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', LineSeparator.false);
await waitForMilliSeconds(10);
lgc('Logging catched error message', LineSeparator.false);
await waitForMilliSeconds(10);
lgs('Logging severe message', LineSeparator.false);
await waitForMilliSeconds(10);
lge('Logging error message', LineSeparator.false);
await waitForMilliSeconds(10);
lgh('Logging hiccup message', LineSeparator.false);
await waitForMilliSeconds(10);
lgw('Logging warning message', LineSeparator.false);
await waitForMilliSeconds(10);
lgi('Logging info message', LineSeparator.false);
await waitForMilliSeconds(10);
lgv('Logging verbose message', LineSeparator.false);
await waitForMilliSeconds(10);
lgd('Logging debug message', LineSeparator.false);
await waitForMilliSeconds(10);
lgt('Logging trace message', LineSeparator.false);
await waitForMilliSeconds(10);
lgb('Logging billy message', LineSeparator.false);
await waitForMilliSeconds(10);
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', LineSeparator.false);
await waitForMilliSeconds(10);
lgc('Logging catched error message', LineSeparator.false);
await waitForMilliSeconds(10);
lgs('Logging severe message', LineSeparator.false);
await waitForMilliSeconds(10);
lge('Logging error message', LineSeparator.false);
await waitForMilliSeconds(10);
lge('Logging hiccup message', LineSeparator.false);
await waitForMilliSeconds(10);
lgw('Logging warning message', LineSeparator.false);
await waitForMilliSeconds(10);
lgi('Logging info message', LineSeparator.false);
await waitForMilliSeconds(10);
lgv('Logging verbose message', LineSeparator.false);
await waitForMilliSeconds(10);
lgd('Logging debug message', LineSeparator.false);
await waitForMilliSeconds(10);
lgt('Logging trace message', LineSeparator.false);
await waitForMilliSeconds(10);
lgb('Logging billy message', LineSeparator.false);
await waitForMilliSeconds(10);
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message');
lgc('Logging catched error message');
lgs('Logging severe message');
lge('Logging error message');
lgh('Logging hiccup message');
lgw('Logging warning message');
lgi('Logging info message');
lgv('Logging verbose message');
lgd('Logging debug message');
lgt('Logging trace message');
lgb('Logging billy message');
console.log('------------------------------------------------------------');
lgi('Info Folder 01 .........', LineSeparator.false);
lgi('Info Folder 02 .........', LineSeparator.false);
lgi('Info Folder 03 .........', LineSeparator.false);
lgi('Info Folder 04 .........', LineSeparator.false);
lgi('Info Folder 05 .........', LineSeparator.false);
lgi('Info Folder 06 .........', LineSeparator.false);
lgi('Info Folder 07 .........', LineSeparator.false);
lgi('Info Folder 08 .........', LineSeparator.false);
lgi('Info Folder 09 .........', LineSeparator.false);
lgi('Info Folder 10 .........', LineSeparator.false);
lgi('');
lgi('Info Folder 50 .........');
console.log('------------------------------------------------------------');
lge(
    `\tKeith Orr Nissan Shreveport - Inventory Online : https://www.homenetiol.com/inventory/vehicle/2254309/1201950521?i=85&r=2254309#general`,
    LoggingPrefix.false
);
lge(
    `\t\tKeith Orr Nissan Shreveport - Inventory Online : https://www.homenetiol.com/inventory/vehicle/2254309/1201950521?i=85&r=2254309#general`,
    LoggingPrefix.false
);
lge(
    `\t\t\tKeith Orr Nissan Shreveport - Inventory Online : https://www.homenetiol.com/inventory/vehicle/2254309/1201950521?i=85&r=2254309#general`,
    LoggingPrefix.false
);
lge(
    `\t\t\t\tKeith Orr Nissan Shreveport - Inventory Online : https://www.homenetiol.com/inventory/vehicle/2254309/1201950521?i=85&r=2254309#general`,
    LoggingPrefix.false
);
