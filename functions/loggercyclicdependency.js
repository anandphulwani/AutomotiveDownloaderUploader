/* eslint-disable import/extensions */
import { loggerFile, loggerConsole, addIndividualTransportCatcherrorFileWinston, addIndividualTransportWarnFileWinston } from './logger.js';
/* eslint-enable import/extensions */

/**
 *  Function is called by
 *
 * 01. loggeruniqueidgenerators.js
 * 02. locksupportive.js
 *
 *  in order to break the chain of cyclic dependency.
 *  The dependency is as follows
 *
 *  a. lgu, lgc, lge needs to generate unique ids.
 *  b. generate unique id needs to take lock (attainlock,releaselock) on config.js to get id and increment it.
 *  c. attainlock needs lgu,lgc,lge to log error if it occur.s
 *
 * @param  {...any} args
 */
const lgccyclicdependency = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const filename = 'loggercyclicdependency.js';
    const lineNumber = '00';
    const uniqueId = '######';
    loggerConsole.catcherror(...args, { filename, lineNumber, uniqueId });
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lgwcyclicdependency = (...args) => {
    addIndividualTransportWarnFileWinston();
    const filename = 'loggercyclicdependency.js';
    const lineNumber = '00';
    const uniqueId = '######';
    loggerConsole.warn(...args, { filename, lineNumber, uniqueId });
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

// eslint-disable-next-line import/prefer-default-export
export { lgccyclicdependency, lgwcyclicdependency };
