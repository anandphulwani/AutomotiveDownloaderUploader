/* eslint-disable import/extensions */
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
} from './logger.js';
import { generateAndGetNonCatchErrorLogLevels9DigitUniqueId, generateAndGetCatchErrorLogLevels6DigitUniqueId } from './configsupportive.js';
/* eslint-enable import/extensions */

const getCallerDetails = (...args) => {
    let stackTrace;
    let filename;
    let lineNumber;
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (arg instanceof Error) {
            stackTrace = arg.stack.split('\n');
            const stackDetailsCatchLine = stackTrace[1].match(/at (.+)\/(.+?):(\d+):(\d+)/);
            [, , filename, lineNumber] = stackDetailsCatchLine;
        }
    }
    if (filename === undefined && lineNumber === undefined) {
        stackTrace = new Error().stack.split('\n');
        const stackDetailsCatchLine = stackTrace[3].match(/at (.+)\/(.+?):(\d+):(\d+)/);
        [, , filename] = stackDetailsCatchLine;
        if (stackTrace[4] !== undefined) {
            const stackDetailsErrorLineInTry = stackTrace[4].match(/at (.+)\/(.+?):(\d+):(\d+)/);
            lineNumber = `${stackDetailsCatchLine[3]},${stackDetailsErrorLineInTry[3]}`;
        } else {
            [, , , lineNumber] = stackDetailsCatchLine;
        }
    }
    return {
        filename: filename,
        lineNumber: lineNumber,
    };
};

const lgc = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { filename, lineNumber, uniqueId });
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lge = (...args) => {
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { filename, lineNumber, uniqueId });
    loggerFile.error(...args, { filename, lineNumber, uniqueId });
};

const lgw = (...args) => {
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { filename, lineNumber, uniqueId });
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

const lgi = (...args) => {
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { filename, lineNumber, uniqueId });
    loggerFile.info(...args, { filename, lineNumber, uniqueId });
};

const lgv = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.verbose(message);
    loggerFile.verbose(message);
};

const lgd = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.debug(message);
    loggerFile.debug(message);
};

const lgs = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.silly(message);
    loggerFile.silly(message);
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lge, lgw, lgi, lgv, lgd, lgs };
