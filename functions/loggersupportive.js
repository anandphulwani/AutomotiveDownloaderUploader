/* eslint-disable import/extensions */
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportUnreachableFileWinston,
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
        if (stackTrace[0] === 'Error') {
            stackTrace.shift();
        }
        if (stackTrace[0].trim().startsWith('at getCallerDetails')) {
            stackTrace.shift();
            stackTrace.shift();
        }
        const stackDetailsCatchLine = stackTrace[0].match(/at (.+)\/(.+?):(\d+):(\d+)/);
        if (stackDetailsCatchLine) {
            let [, fullFilePath] = stackDetailsCatchLine;
            [, , filename, lineNumber] = stackDetailsCatchLine;
            fullFilePath += `/${filename}`;
            if (stackTrace[1] !== undefined) {
                const stackDetailsErrorLineInTry = stackTrace[1].match(/at (.+)\/(.+?):(\d+):(\d+)/);
                if (stackDetailsErrorLineInTry) {
                    let [, fullFilePath2ndLine] = stackDetailsErrorLineInTry;
                    const [, , filename2ndLine, lineNumber2ndLine] = stackDetailsErrorLineInTry;
                    fullFilePath2ndLine += `/${filename2ndLine}`;
                    if (fullFilePath === fullFilePath2ndLine) {
                        lineNumber += `,${lineNumber2ndLine}`;
                    }
                }
            }
        } else {
            filename = '';
            lineNumber = '';
        }
    }
    return {
        filename: filename,
        lineNumber: lineNumber,
    };
};

const lgu = (...args) => {
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { filename, lineNumber, uniqueId });
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId });
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

const lgcf = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lgef = (...args) => {
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { filename, lineNumber, uniqueId });
};

const lgwf = (...args) => {
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

const lgif = (...args) => {
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { filename, lineNumber, uniqueId });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lge, lgw, lgi, lgv, lgd, lgs, lgcf, lgef, lgwf, lgif };
