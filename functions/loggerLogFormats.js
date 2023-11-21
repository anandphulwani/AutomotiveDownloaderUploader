import chalk from 'chalk';
import { format } from 'winston';

/* eslint-disable import/extensions */
import { getColPosOnTerminal } from './terminal.js';
import { padStartAndEnd } from './stringformatting.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
/* eslint-enable import/extensions */

const { printf } = format;

// TODO: create stack color similar to the main color as for catcherror, if a custom color is given, as in the situation above, create similar to the custom color
const stringToChalkColor = {
    cyan: [chalk.cyan, chalk.cyan],
    bgCyan: [chalk.bgCyan.bold, chalk.bgCyan.bold],
    cyanBold: [chalk.cyan.bold, chalk.cyan.bold],
    green: [chalk.green.bold, chalk.green.bold],
    bgGreen: [chalk.white.bgGreen.bold, chalk.white.bgGreen.bold],
    yellow: [chalk.yellow.bold, chalk.yellow.bold],
    bgYellow: [chalk.white.bgYellow.bold, chalk.white.bgYellow.bold],
    red: [chalk.red.bold, chalk.red.bold],
    bgRed: [chalk.white.bgRed.bold, chalk.white.bgRed.bold],
    magenta: [chalk.magenta.bold, chalk.magenta.bold],
    bgMagenta: [chalk.white.bgMagenta.bold, chalk.white.bgMagenta.bold],
    white: [chalk.whiteBright, chalk.whiteBright],
    bgWhite: [chalk.black.bgWhiteBright, chalk.black.bgWhiteBright],
};

const levelToChalkColor = {
    unhandledexception: [chalk.white.bgRgb(255, 0, 0).bold, chalk.white.bgRgb(255, 0, 0).bold],
    unreachable: [chalk.white.bgRgb(255, 0, 0).bold, chalk.white.bgRgb(255, 0, 0).bold],
    catcherror: [chalk.bgRgb(248, 100, 90).whiteBright, chalk.bgRgb(248, 100, 90).whiteBright],
    severe: [chalk.white.bgRgb(163, 0, 10).bold, chalk.white.bgRgb(163, 0, 10).bold],
    error: [chalk.white.bgRed.bold, chalk.white.bgRed.bold],
    hiccup: [chalk.red.bold, chalk.red.bold],
    warning: [chalk.white.bgYellow.bold, chalk.white.bgYellow.bold],
    info: [chalk.cyan, chalk.cyan],
    verbose: [chalk.white.bgGreenBright.bold, chalk.white.bgGreenBright.bold],
    debug: [chalk.white.bgMagentaBright.bold, chalk.white.bgMagentaBright.bold],
    trace: [chalk.bgRgb(242, 140, 40).bold, chalk.bgRgb(242, 140, 40).bold],
    billy: [chalk.black.bgWhiteBright, chalk.black.bgWhiteBright],
};

/**
 * formatMultiLineStringToFixedLength(str, widthOfWindow)
 * Formats multi line string every line to fixed width of the window
 * so the background color doesnt look uneven on multiple lines, but
 * it would look like a rectangle full of background color.
 */
function formatMultiLineStringToFixedLength(str, isErrorStack, formatLastLine = true, widthOfWindow = 120) {
    str = str.split('\n');
    str = str.map((line, index, arr) => {
        if (index === arr.length - 1 && formatLastLine) {
            return line;
        }
        if (index === 0 && !isErrorStack) {
            let posOnTerminal = getColPosOnTerminal();
            let tabIndex = 0;
            while (line.charAt(tabIndex) === '\t') {
                tabIndex++;
            }
            posOnTerminal += tabIndex * 7;
            return line.padEnd(Math.ceil((posOnTerminal - 1 + line.length) / widthOfWindow) * widthOfWindow - posOnTerminal + 1, ' ');
        }
        return line.padEnd(Math.ceil(line.length / widthOfWindow) * widthOfWindow, ' ');
    });
    str = str.join('\n');
    return str;
}

/**
 *
 *
 *
 *
 */
const lastWriteLineSepObj = {};
// eslint-disable-next-line no-unused-vars
function logFormat(typeOfLogFormat, detailsObj, logFilename) {
    lastWriteLineSepObj[logFilename] = Object.prototype.hasOwnProperty.call(lastWriteLineSepObj, logFilename)
        ? lastWriteLineSepObj[logFilename]
        : true;
    let { level, message, stack } = detailsObj;
    const { timestamp: ts, [Symbol.for('splat')]: sp } = detailsObj;

    level = level === 'warn' ? 'warning' : level;
    // console.log(`logFormat${typeOfLogFormat} Called, level: ${level}, message: ${message}`);
    // eslint-disable-next-line prefer-const
    let { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator } =
        sp !== undefined
            ? sp.slice(-1)[0]
            : { callerHierarchy: '', uniqueId: '', textColor: undefined, loggingPrefix: LoggingPrefix.true, lineSeparator: LineSeparator.true };
    callerHierarchy = callerHierarchy === undefined ? '' : callerHierarchy;
    uniqueId = uniqueId === undefined ? '' : uniqueId;
    loggingPrefix = loggingPrefix === undefined ? LoggingPrefix.true : loggingPrefix;
    lineSeparator = lineSeparator === undefined ? LineSeparator.true : lineSeparator;

    let logMesg = [];
    if (loggingPrefix.name === true) {
        if (typeOfLogFormat === 'console') {
            if (
                uniqueId !== undefined &&
                (level === 'unhandledexception' || level === 'unreachable' || level === 'catcherror' || level === 'severe')
            ) {
                logMesg.push(`[${uniqueId}]`);
            }
            if (level !== 'hiccup' && level !== 'info') {
                logMesg.push(`${level.toUpperCase()}:`);
            }
        } else if (typeOfLogFormat === 'file') {
            ts !== undefined ? logMesg.push(ts) : null;
            uniqueId !== undefined ? logMesg.push(`[${uniqueId.padStart(9, ' ')}]`) : null;
            logMesg.push(`[${padStartAndEnd(`${level === 'warn' ? 'WARNING' : level.toUpperCase()}`, 21, ' ')}]`);
        }
    }
    // If custom message is sent then, the custom message is merged with the first line of error message.
    if (stack !== undefined && stack.length > 0) {
        if (message.includes(stack)) {
            message = message.replace(stack, '');
            message = message.trim();
        }
        stack = stack.split('\n');
        const regex = new RegExp(`^(\\S+?):(?:[ ]?)${message}$`);
        if (regex.test(stack[0])) {
            stack.shift();
            message = message.trim();
        } else {
            const errorString = stack[0].replace(/^[a-zA-Z]*Error:/, '').trim();
            message = message.replace(errorString, '').trim();
        }
        stack = stack.join('\n');
    }
    logMesg.push(message);
    if (lineSeparator.name === true && callerHierarchy !== '') {
        if (
            typeOfLogFormat === 'file' ||
            (typeOfLogFormat === 'console' && (level === 'unreachable' || level === 'catcherror' || level === 'severe'))
        ) {
            logMesg.push(`(${callerHierarchy})`);
        }
    }
    logMesg = logMesg.join(' ');
    logMesg = [logMesg];
    if (typeOfLogFormat === 'console') {
        logMesg[0] = formatMultiLineStringToFixedLength(logMesg[0], false, lineSeparator.name === false && stack === undefined);
    }
    if (stack !== undefined) {
        logMesg.push(formatMultiLineStringToFixedLength(stack, true, lineSeparator.name === false));
    }
    if (typeOfLogFormat === 'console') {
        if (textColor !== undefined && Object.prototype.hasOwnProperty.call(stringToChalkColor, textColor)) {
            logMesg[0] = stringToChalkColor[textColor.name][0](logMesg[0]);
            logMesg[1] !== undefined ? (logMesg[1] = stringToChalkColor[textColor.name][1](logMesg[1])) : null;
        } else if (Object.prototype.hasOwnProperty.call(levelToChalkColor, level)) {
            logMesg[0] = levelToChalkColor[level][0](logMesg[0]);
            logMesg[1] !== undefined ? (logMesg[1] = levelToChalkColor[level][1](logMesg[1])) : null;
        } else {
            logMesg[0] = chalk.inverse(logMesg);
            logMesg[1] !== undefined ? (logMesg[1] = chalk.inverse(logMesg)) : null;
        }
    }
    logMesg = logMesg.join('\n');
    if (typeOfLogFormat === 'file') {
        if (loggingPrefix.name === true && !lastWriteLineSepObj[logFilename]) {
            logMesg = `\n${logMesg}`;
        }
    }
    lastWriteLineSepObj[logFilename] = lineSeparator.name;
    lineSeparator.name ? (logMesg = `${logMesg}\n`) : null;
    return logMesg;
}

// Define log functions
/* #region logFormatFile and logFormatConsole : Begin */
const logFormatFile = (logFilename) => printf((detailsObj) => logFormat('file', detailsObj, logFilename));

const logFormatConsole = printf((detailsObj) => logFormat('console', detailsObj, undefined));

/* #endregion logFormatFile and logFormatConsole : End */

export { logFormatFile, logFormatConsole };
