import chalk from 'chalk';

/* eslint-disable import/extensions */
import { getCallerDetails } from './callerdetails.js';
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportSevereFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportBillyFileWinston,
} from './logger.js';
import { generateAndGetNonCatchErrorLogLevels9DigitUniqueId, generateAndGetCatchErrorLogLevels6DigitUniqueId } from './loggeruniqueidgenerators.js';
/* eslint-enable import/extensions */

function convertArgsToProperOrder(...args) {
    let message = '';
    let lineSep = true;
    let error;

    args.forEach((arg) => {
        // console.log(typeof arg);
        if (typeof arg === 'string') {
            message = arg;
        } else if (typeof arg === 'boolean') {
            lineSep = arg;
        } else if (arg instanceof Error) {
            error = arg;
        }
    });

    return [message, error, lineSep];
}

const lgc = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgu = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgs = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportSevereFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.severe(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.severe(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lge = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.error(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgw = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.warn(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgi = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.info(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgv = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportVerboseFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.verbose(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgd = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportDebugFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.debug(...args, { filename, lineNumber, uniqueId, lineSep });
};

/**
 * This function is used for those parts of the code,
 * which should never be called, or errors that should never generate.
 */
const lgb = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportBillyFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.billy(...args, { filename, lineNumber, uniqueId, lineSep });
    loggerFile.billy(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgcf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lguf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgsf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportSevereFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.severe(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgef = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgwf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgif = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgvf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportVerboseFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgdf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportDebugFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { filename, lineNumber, uniqueId, lineSep });
};

const lgbf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportBillyFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.billy(...args, { filename, lineNumber, uniqueId, lineSep });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lgs, lge, lgw, lgi, lgv, lgd, lgb, lgcf, lguf, lgsf, lgef, lgwf, lgif, lgvf, lgdf, lgbf };
