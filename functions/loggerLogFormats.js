import chalk from 'chalk';
import { format } from 'winston';

/* eslint-disable import/extensions */
import { getColPosOnTerminal } from './terminal.js';
import { padStartAndEnd } from './stringformatting.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
/* eslint-enable import/extensions */

const { printf } = format;

// Define log functions
/* #region logFormatFile and logFormatConsole : Begin */
const lastWriteLineSepObj = {};
const logFormatFile = (logFilename) =>
    printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
        // console.log(`logFormatFile Called, level:${level}`);
        const lastWriteLineSep = Object.prototype.hasOwnProperty.call(lastWriteLineSepObj, logFilename) ? lastWriteLineSepObj[logFilename] : true;
        const { callerHierarchy, uniqueId, loggingPrefix, lineSep } =
            sp !== undefined
                ? sp.slice(-1)[0]
                : { callerHierarchy: '', uniqueId: '', loggingPrefix: LoggingPrefix.true, lineSep: LineSeparator.true };
        let logMesg = [];
        if (loggingPrefix.name === true && lastWriteLineSep) {
            ts !== undefined ? logMesg.push(ts) : null;
            uniqueId !== undefined ? logMesg.push(`[${uniqueId.padStart(9, ' ')}]`) : null;
            logMesg.push(`[${padStartAndEnd(`${level.toUpperCase() === 'WARN' ? 'WARNING' : level.toUpperCase()}`, 21, ' ')}]`);
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
        if (callerHierarchy !== '' && sp !== undefined && lineSep.name === true) {
            logMesg.push(`(${callerHierarchy})`);
        }
        logMesg = logMesg.join(' ');
        if (stack !== undefined && !logMesg.includes(stack)) {
            logMesg = `${logMesg}\n${stack}`;
        }
        if (lineSep.name) {
            logMesg = `${logMesg}\n`;
        }
        lastWriteLineSepObj[logFilename] = lineSep.name;
        return logMesg;
    });

const logFormatConsole = printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
    // console.log(`logFormatConsole Called, level: ${level}, message: ${message}`);
    const { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSep } =
        sp !== undefined
            ? sp.slice(-1)[0]
            : { callerHierarchy: '', uniqueId: '', textColor: undefined, loggingPrefix: LoggingPrefix.true, lineSep: LineSeparator.true };
    let logMesg = [];
    if (loggingPrefix.name === true) {
        ts !== undefined ? logMesg.push(ts) : null;
        if (level === 'unreachable' || level === 'catcherror' || level === 'severe') {
            uniqueId !== undefined ? logMesg.push(`[${uniqueId}]`) : null;
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
    let levelToPrint = '';
    if (loggingPrefix.name === true) {
        if (level === 'warn') {
            levelToPrint = 'warning';
        } else if (level === 'hiccup' || level === 'info') {
            levelToPrint = '';
        } else {
            levelToPrint = level;
        }
    }
    if (levelToPrint !== '') {
        logMesg.push(`${levelToPrint}:`.toUpperCase());
    }
    logMesg.push(message);
    if (
        (level === 'unreachable' || level === 'catcherror' || level === 'severe') &&
        callerHierarchy !== '' &&
        sp !== undefined &&
        lineSep.name === true
    ) {
        logMesg.push(`(${callerHierarchy})`);
    }
    logMesg = logMesg.join(' ');
    logMesg = logMesg.split('\n');
    logMesg = logMesg.map((line, index, arr) => {
        if (index === arr.length - 1 && lineSep.name === false && stack === undefined) {
            return line;
        }
        if (index === 0) {
            let posOnTerminal = getColPosOnTerminal();
            let tabIndex = 0;
            while (line.charAt(tabIndex) === '\t') {
                tabIndex++;
            }
            posOnTerminal += tabIndex * 7;
            return line.padEnd(Math.ceil((posOnTerminal - 1 + line.length) / 120) * 120 - posOnTerminal + 1, ' ');
        }
        return line.padEnd(Math.ceil(line.length / 120) * 120, ' ');
    });
    logMesg = logMesg.join('\n');
    if (lineSep.name) {
        logMesg = `${logMesg}\n`;
    }
    if (stack !== undefined) {
        if (!lineSep.name) {
            logMesg = `${logMesg}\n`;
        }
        stack = stack.split('\n');
        stack = stack.map((line, index, arr) => {
            if (index === arr.length - 1 && lineSep.name === false) {
                return line;
            }
            return line.padEnd(Math.ceil(line.length / 120) * 120, ' ');
        });
        stack = stack.join('\n');
        if (lineSep.name) {
            stack = `${stack}\n`;
        }
    }
    if (textColor !== undefined) {
        if (textColor.name === 'cyan') {
            logMesg = chalk.cyan(logMesg);
        } else if (textColor.name === 'bgCyan') {
            logMesg = chalk.bgCyan.bold(logMesg);
        } else if (textColor.name === 'cyanBold') {
            logMesg = chalk.cyan.bold(logMesg);
        } else if (textColor.name === 'green') {
            logMesg = chalk.green.bold(logMesg);
        } else if (textColor.name === 'bgGreen') {
            logMesg = chalk.white.bgGreen.bold(logMesg);
        } else if (textColor.name === 'yellow') {
            logMesg = chalk.yellow.bold(logMesg);
        } else if (textColor.name === 'bgYellow') {
            logMesg = chalk.white.bgYellow.bold(logMesg);
        } else if (textColor.name === 'red') {
            logMesg = chalk.red.bold(logMesg);
        } else if (textColor.name === 'bgRed') {
            logMesg = chalk.white.bgRed.bold(logMesg);
        } else if (textColor.name === 'magenta') {
            logMesg = chalk.magenta.bold(logMesg);
        } else if (textColor.name === 'bgMagenta') {
            logMesg = chalk.white.bgMagenta.bold(logMesg);
        } else if (textColor.name === 'white') {
            logMesg = chalk.whiteBright(logMesg);
        } else if (textColor.name === 'bgWhite') {
            logMesg = chalk.black.bgWhiteBright(logMesg);
        }
    }
    // TODO: create stack color similar to the main color as for catcherror, if a custom color is given, as in the situation above, create similar to the custom color
    if (level === 'unhandledexception') {
        textColor === undefined ? (logMesg = chalk.white.bgRgb(255, 0, 0).bold(logMesg)) : null;
    } else if (level === 'unreachable') {
        textColor === undefined ? (logMesg = chalk.white.bgRgb(255, 0, 0).bold(logMesg)) : null;
    } else if (level === 'catcherror') {
        textColor === undefined ? (logMesg = chalk.bgRgb(248, 100, 90).whiteBright(logMesg)) : null;
    } else if (level === 'severe') {
        textColor === undefined ? (logMesg = chalk.white.bgRgb(163, 0, 10).bold(logMesg)) : null;
    } else if (level === 'error') {
        textColor === undefined ? (logMesg = chalk.white.bgRed.bold(logMesg)) : null;
    } else if (level === 'hiccup') {
        textColor === undefined ? (logMesg = chalk.red.bold(logMesg)) : null;
    } else if (level === 'warn') {
        textColor === undefined ? (logMesg = chalk.white.bgYellow.bold(logMesg)) : null;
    } else if (level === 'info') {
        textColor === undefined ? (logMesg = chalk.cyan(logMesg)) : null;
    } else if (level === 'verbose') {
        textColor === undefined ? (logMesg = chalk.white.bgGreenBright.bold(logMesg)) : null;
    } else if (level === 'debug') {
        textColor === undefined ? (logMesg = chalk.white.bgMagentaBright.bold(logMesg)) : null;
    } else if (level === 'trace') {
        textColor === undefined ? (logMesg = chalk.bgRgb(242, 140, 40).bold(logMesg)) : null;
    } else if (level === 'billy') {
        textColor === undefined ? (logMesg = chalk.black.bgWhiteBright(logMesg)) : null;
    } else {
        textColor === undefined ? (logMesg = chalk.inverse(logMesg)) : null;
    }
    logMesg += stack !== undefined ? `${chalk.bgRgb(248, 131, 121).whiteBright(stack)}` : '';
    return logMesg;
});
/* #endregion logFormatFile and logFormatConsole : End */

export { logFormatFile, logFormatConsole };
