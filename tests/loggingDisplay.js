/* eslint-disable import/extensions */
import chalk from 'chalk';
import { config } from '../configs/config.js';
import { lgu, lgc, lge, lgw, lgi, lgv, lgd, lgb, lgs } from '../functions/loggersupportive.js';
import { sleep, waitForMilliSeconds } from '../functions/sleep.js';
import { getColPosOnTerminal } from '../functions/terminal.js';
/* eslint-enable import/extensions */

const errorToTest = new Error('Error to be test here!');

lge('Logging message 01');
lge('Logging message 02', true);
lge('Logging message 03', true, new Error('Error to be test 03'));
lge('Logging message 04', new Error('Error to be test 04'));
lge('Logging message 05', new Error('Error to be test 05'), true);
lge(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lge('Logging message 02', false);
lge('Logging message 03', false, new Error('Error to be test 03'));
lge('Logging message 05', new Error('Error to be test 05'), false);
lge(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lge('Logging message 01');
lge('Logging message 02', false);
lge('Logging message 03', false, new Error('Error to be test 03'));
lge('Logging message 04', new Error('Error to be test 04'));
lge('Logging message 05', new Error('Error to be test 05'), false);
lge(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgc('Logging message 01');
lgc('Logging message 02', true);
lgc('Logging message 03', true, new Error('Error to be test 03'));
lgc('Logging message 04', new Error('Error to be test 04'));
lgc('Logging message 05', new Error('Error to be test 05'), true);
lgc(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgc('Logging message 02', false);
lgc('Logging message 03', false, new Error('Error to be test 03'));
lgc('Logging message 05', new Error('Error to be test 05'), false);
lgc(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgc('Logging message 01');
lgc('Logging message 02', false);
lgc('Logging message 03', false, new Error('Error to be test 03'));
lgc('Logging message 04', new Error('Error to be test 04'));
lgc('Logging message 05', new Error('Error to be test 05'), false);
lgc(new Error('Error to be test 06'));
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', errorToTest);
lgc('Logging catched error message', errorToTest);
lge('Logging error message', errorToTest);
lgw('Logging warning message');
lgi('Logging info message');
lgv('Logging verbose message');
lgd('Logging debug message');
lgb('Logging billy message');
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', errorToTest, false);
lgc('Logging catched error message', errorToTest, false);
lgs('Logging severe message', errorToTest, false);
lge('Logging error message', errorToTest, false);
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', false);
await waitForMilliSeconds(10);
lgc('Logging catched error message', false);
await waitForMilliSeconds(10);
lgs('Logging severe message', false);
await waitForMilliSeconds(10);
lge('Logging error message', false);
await waitForMilliSeconds(10);
lgw('Logging warning message', false);
await waitForMilliSeconds(10);
lgi('Logging info message', false);
await waitForMilliSeconds(10);
lgv('Logging verbose message', false);
await waitForMilliSeconds(10);
lgd('Logging debug message', false);
await waitForMilliSeconds(10);
lgb('Logging billy message', false);
await waitForMilliSeconds(10);
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message', false);
await waitForMilliSeconds(10);
lgc('Logging catched error message', false);
await waitForMilliSeconds(10);
lgs('Logging severe message', false);
await waitForMilliSeconds(10);
lge('Logging error message', false);
await waitForMilliSeconds(10);
lgw('Logging warning message', false);
await waitForMilliSeconds(10);
lgi('Logging info message', false);
await waitForMilliSeconds(10);
lgv('Logging verbose message', false);
await waitForMilliSeconds(10);
lgd('Logging debug message', false);
await waitForMilliSeconds(10);
lgb('Logging billy message', false);
await waitForMilliSeconds(10);
console.log('------------------------------------------------------------');
lgu('Logging unreachable error message');
lgc('Logging catched error message');
lgs('Logging severe message');
lge('Logging error message');
lgw('Logging warning message');
lgi('Logging info message');
lgv('Logging verbose message');
lgd('Logging debug message');
lgb('Logging billy message');
console.log('------------------------------------------------------------');
lgi('Info Folder 01 .........', false);
lgi('Info Folder 02 .........', false);
lgi('Info Folder 03 .........', false);
lgi('Info Folder 04 .........', false);
lgi('Info Folder 05 .........', false);
lgi('Info Folder 06 .........', false);
lgi('Info Folder 07 .........', false);
lgi('Info Folder 08 .........', false);
lgi('Info Folder 09 .........', false);
lgi('Info Folder 10 .........', false);
lgi('');
lgi('Info Folder 50 .........');

console.log('------------------------------------------------------------');
