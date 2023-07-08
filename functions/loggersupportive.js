import chalk from 'chalk';

/* eslint-disable import/extensions */
import { getCallerDetails } from './callerdetails.js';
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportSillyFileWinston,
} from './logger.js';
import { generateAndGetNonCatchErrorLogLevels9DigitUniqueId, generateAndGetCatchErrorLogLevels6DigitUniqueId } from './loggeruniqueidgenerators.js';
/* eslint-enable import/extensions */

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
    addIndividualTransportVerboseFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { filename, lineNumber, uniqueId });
    loggerFile.verbose(...args, { filename, lineNumber, uniqueId });
};

const lgd = (...args) => {
    addIndividualTransportDebugFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { filename, lineNumber, uniqueId });
    loggerFile.debug(...args, { filename, lineNumber, uniqueId });
};

const lgs = (...args) => {
    addIndividualTransportSillyFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.silly(...args, { filename, lineNumber, uniqueId });
    loggerFile.silly(...args, { filename, lineNumber, uniqueId });
};

const lguf = (...args) => {
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId });
};

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

const lgvf = (...args) => {
    addIndividualTransportVerboseFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { filename, lineNumber, uniqueId });
};

const lgdf = (...args) => {
    addIndividualTransportDebugFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { filename, lineNumber, uniqueId });
};

const lgsf = (...args) => {
    addIndividualTransportSillyFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.silly(...args, { filename, lineNumber, uniqueId });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lge, lgw, lgi, lgv, lgd, lgs, lgcf, lguf, lgef, lgwf, lgif, lgvf, lgdf, lgsf };
