import chalk from 'chalk';

/* eslint-disable import/extensions */
import { getCallerHierarchyFormatted } from './callerdetails.js';
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
import Color from '../class/Colors.js';
/* eslint-enable import/extensions */

function convertArgsToProperOrder(...args) {
    let message = '';
    let error;
    let lineSep = true;
    let textColor;

    args.forEach((arg) => {
        // console.log(typeof arg);
        if (typeof arg === 'string') {
            message = arg;
        } else if (typeof arg === 'boolean') {
            lineSep = arg;
        } else if (arg instanceof Error) {
            error = arg;
        } else if (arg instanceof Color) {
            textColor = arg;
        }
    });

    return [message, error, textColor, lineSep];
}

const lgc = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgu = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgs = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportSevereFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.severe(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.severe(...args, { callerHierarchy, uniqueId, lineSep });
};

const lge = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportErrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.error(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgw = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportWarnFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.warn(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgi = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    const textColor = args.pop();
    addIndividualTransportInfoFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { callerHierarchy, uniqueId, textColor, lineSep });
    loggerFile.info(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgv = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgd = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportDebugFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.debug(...args, { callerHierarchy, uniqueId, lineSep });
};

/**
 * This function is used for those parts of the code,
 * which should never be called, or errors that should never generate.
 */
const lgb = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportBillyFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.billy(...args, { callerHierarchy, uniqueId, lineSep });
    loggerFile.billy(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgcf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, lineSep });
};

const lguf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgsf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportSevereFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.severe(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgef = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportErrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgwf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportWarnFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgif = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportInfoFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgvf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgdf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportDebugFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { callerHierarchy, uniqueId, lineSep });
};

const lgbf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const lineSep = args.pop();
    addIndividualTransportBillyFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.billy(...args, { callerHierarchy, uniqueId, lineSep });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lgs, lge, lgw, lgi, lgv, lgd, lgb, lgcf, lguf, lgsf, lgef, lgwf, lgif, lgvf, lgdf, lgbf };
