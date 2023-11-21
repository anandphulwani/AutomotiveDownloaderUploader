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
    addIndividualTransportHiccupFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportTraceFileWinston,
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
    let lineSeparator = LineSeparator.true;

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
            lineSeparator = arg;
        }
    });

    return [message, error, textColor, loggingPrefix, lineSeparator];
}

/**
 * lgc: is for those errors which are catched by try, catch which are not anticipated, but are catched by try
 * catch blocks and should be handled.
 */
const lgc = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgu: is for those part of lines which should never be called, basically those sections of code
 * which are unreachable, if they are reached, there is some problem in the code.
 */
const lgu = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgs: is for errors which are generated at the application level mainly focused for developer purposes and debugging.
 */
const lgs = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportSevereFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.severe(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.severe(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lge: is for errors which are generated at the user level using the system, which a user should focus on.
 * Can be accompanied by a process.exit(1) also in some situations.
 */
const lge = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportErrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.error(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgh: is for errors which are hiccups generated at the user level, which a user can ignore.
 * which are assumed and accounted for already, as they are going to occur in almost every instance.
 */
const lgh = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportHiccupFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.hiccup(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.hiccup(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgw: is for warnings which are generated at the user level using the system, which a user can focus on.
 * Even if it doesn't it will not disrupt the flow.
 */
const lgw = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportWarnFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.warn(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgi = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportInfoFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.info(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgv = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgd = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportDebugFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.debug(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgt = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportTraceFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.trace(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.trace(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgb = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportBillyFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.billy(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.billy(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgcf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lguf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgsf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportSevereFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.severe(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgef = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportErrorFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lghf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportHiccupFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.hiccup(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgwf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportWarnFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgif = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportInfoFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgvf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgdf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportDebugFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgtf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportTraceFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.trace(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgbf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator] = args;
    args.splice(-3);
    addIndividualTransportBillyFileWinston();
    const callerHierarchy = getCallerHierarchyFormatted(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.billy(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lgs, lge, lgh, lgw, lgi, lgv, lgd, lgt, lgb, lgcf, lguf, lgsf, lgef, lghf, lgwf, lgif, lgvf, lgdf, lgtf, lgbf };
