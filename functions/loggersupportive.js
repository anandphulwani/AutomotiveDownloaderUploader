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
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
/* eslint-enable import/extensions */

function convertArgsToProperOrder(...args) {
    let message = '';
    let error;
    let textColor;
    let loggingPrefix = LoggingPrefix.true;
    let lineSep = LineSeparator.true;

    args.forEach((arg) => {
        // console.log(typeof arg);
        if (typeof arg === 'string') {
            message = arg;
        } else if (arg instanceof Error) {
            error = arg;
        } else if (arg instanceof Color) {
            textColor = arg;
        } else if (arg instanceof LoggingPrefix) {
            loggingPrefix = arg;
        } else if (arg instanceof LineSeparator) {
            lineSep = arg;
        }
    });

    return [message, error, textColor, loggingPrefix, lineSep];
}

/**
 * lgc: is for those errors which are catched by try, catch which are not anticipated, but are catched by try
 * catch blocks and should be handled.
 */
const lgc = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

/**
 * lgu: is for those part of lines which should never be called, basically those sections of code
 * which are unreachable, if they are reached, there is some problem in the code.
 */
const lgu = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

/**
 * lgs: is for errors which are generated at the application level mainly focused for developer purposes and debugging.
 */
const lgs = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportSevereFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.severe(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.severe(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

/**
 * lge: is for errors which are generated at the user level using the system, which a user should focus on.
 * Can be accompanied by a process.exit(1) also in some situations.
 */
const lge = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportErrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.error(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

/**
 * lgw: is for warnings which are generated at the user level using the system, which a user can focus on.
 * Even if it doesn't it will not disrupt the flow.
 */
const lgw = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportWarnFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.warn(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgi = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportInfoFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.info(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgv = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgd = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportDebugFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.debug(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgb = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportBillyFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.billy(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep });
    loggerFile.billy(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgcf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lguf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgsf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportSevereFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.severe(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgef = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportErrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgwf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportWarnFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgif = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportInfoFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgvf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgdf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportDebugFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

const lgbf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSep] = args;
    args.splice(-3);
    addIndividualTransportBillyFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.billy(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSep });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lgs, lge, lgw, lgi, lgv, lgd, lgb, lgcf, lguf, lgsf, lgef, lgwf, lgif, lgvf, lgdf, lgbf };
