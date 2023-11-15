import chalk from 'chalk';
import { createLogger, format, transports } from 'winston';

/* eslint-disable import/extensions */
import { currentDateTimeReadableFormatted } from './datetime.js';
import { instanceRunLogFilePrefix } from './loggervariables.js';
import { getColPosOnTerminal } from './terminal.js';
import { padStartAndEnd } from './stringformatting.js';
/* eslint-enable import/extensions */

const { combine, timestamp, printf, errors } = format;
const levels = { unreachable: 0, catcherror: 1, severe: 2, error: 3, warn: 4, info: 5, verbose: 6, debug: 7, billy: 8 };

// Define log functions
/* #region logFormatFile and logFormatConsole : Begin */
const lastWriteLineSepObj = {};
const logFormatFile = (logFilename) =>
    printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
        // console.log(`logFormatFile Called, level:${level}`);
        const lastWriteLineSep = Object.prototype.hasOwnProperty.call(lastWriteLineSepObj, logFilename) ? lastWriteLineSepObj[logFilename] : true;
        const { filename, lineNumber, uniqueId, lineSep } =
            sp !== undefined ? sp.slice(-1)[0] : { filename: '', lineNumber: '', uniqueId: '', lineSep: true };
        let logMesg = [];
        if (lastWriteLineSep) {
            ts !== undefined ? logMesg.push(ts) : null;
            uniqueId !== undefined ? logMesg.push(`[${uniqueId.padStart(9, ' ')}]`) : null;
            logMesg.push(`[${padStartAndEnd(`${level.toUpperCase() === 'WARN' ? 'WARNING' : level.toUpperCase()}`, 13, ' ')}]`);
        }
        if (sp === undefined || lineSep === false) {
            logMesg.push(`${message}`);
        } else {
            logMesg.push(`${message} (${filename}:${lineNumber})`);
        }
        logMesg = logMesg.join(' ');
        if (stack !== undefined && !logMesg.includes(stack)) {
            logMesg = `${logMesg}\n${stack}`;
        }
        if (lineSep) {
            logMesg = `${logMesg}\n`;
        }
        lastWriteLineSepObj[logFilename] = lineSep;
        return logMesg;
    });

const logFormatConsole = printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
    message = message.trim();
    // console.log(`logFormatConsole Called, level:${level}`);
    const { filename, lineNumber, uniqueId, lineSep } =
        sp !== undefined ? sp.slice(-1)[0] : { filename: '', lineNumber: '', uniqueId: '', lineSep: true };
    let logMesg = [];
    ts !== undefined ? logMesg.push(ts) : null;
    if (level === 'catcherror' || level === 'unreachable') {
        uniqueId !== undefined ? logMesg.push(`[${uniqueId}]`) : null;
    }
    // If custom message is sent then, the custom message is merged with the first line of error message.
    if (stack !== undefined && stack.length > 0) {
        stack = stack.split('\n');
        const regex = new RegExp(`^(\\S+?): ${message}$`);
        if (regex.test(stack[0])) {
            stack.shift();
        } else {
            const errorString = stack[0].replace(/^[a-zA-Z]*Error:/, '').trim();
            message = message.replace(errorString, '');
        }
        stack = stack.join('\n');
    }
    let levelToPrint = '';
    if (level === 'warn') {
        levelToPrint = 'warning';
    } else if (level === 'info') {
        levelToPrint = '';
    } else {
        levelToPrint = level;
    }
    if (level !== 'info') {
        logMesg.push(`${levelToPrint}:`.toUpperCase());
    }
    logMesg.push(message);
    // logMesg.push(`${message} (${filename}:${lineNumber})`);
    logMesg = logMesg.join(' ');
    logMesg = logMesg.split('\n');
    logMesg = logMesg.map((line, index, arr) => {
        if (index === arr.length - 1 && lineSep === false && !(level === 'catcherror' && stack !== undefined)) {
            return line;
        }
        if (index === 0) {
            return line.padEnd(120 - getColPosOnTerminal() + 1, ' ');
        }
        return line.padEnd(120, ' ');
    });
    logMesg = logMesg.join('\n');
    if (lineSep) {
        logMesg = `${logMesg}\n`;
    }
    if (level === 'catcherror') {
        logMesg = chalk.bgRgb(248, 100, 90).whiteBright(logMesg);
        if (stack !== undefined) {
            if (!lineSep) {
                logMesg = `${logMesg}\n`;
            }
            stack = stack.split('\n');
            stack = stack.map((line, index, arr) => {
                if (index === arr.length - 1 && lineSep === false) {
                    return line;
                }
                return line.padEnd(120, ' ');
            });
            stack = stack.join('\n');
            if (lineSep) {
                stack = `${stack}\n`;
            }
            logMesg += `${chalk.bgRgb(248, 131, 121).whiteBright(stack)}`;
        }
    } else if (level === 'unreachable') {
        logMesg = chalk.white.bgRgb(255, 0, 0).bold(logMesg);
    } else if (level === 'error') {
        logMesg = chalk.white.bgRed.bold(logMesg);
    } else if (level === 'warn') {
        logMesg = chalk.white.bgYellow.bold(logMesg);
    } else if (level === 'info') {
        logMesg = chalk.cyan(logMesg);
    } else if (level === 'verbose') {
        logMesg = chalk.white.bgGreenBright.bold(logMesg);
    } else if (level === 'debug') {
        logMesg = chalk.white.bgMagentaBright.bold(logMesg);
    } else if (level === 'billy') {
        logMesg = chalk.black.bgWhiteBright(logMesg);
    } else {
        logMesg = chalk.inverse(logMesg);
    }
    return logMesg;
});
/* #endregion logFormatFile and logFormatConsole : End */

/* #region fileTransportOptions and consoleTransportOptions : Begin */
const fileTransportOptions = (logFilename) => ({
    format: combine(timestamp({ format: currentDateTimeReadableFormatted() }), errors({ stack: true }), logFormatFile(logFilename)),
    eol: '',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true,
});

// Define transport options for logging to console
const consoleTransportOptions = {
    format: combine(
        timestamp({ format: currentDateTimeReadableFormatted() }),
        errors({ stack: true }),
        format((info) => {
            delete info.timestamp;
            return info;
        })(),
        logFormatConsole
    ),
    eol: '',
};
/* #endregion fileTransportOptions and consoleTransportOptions : End */

/* #region File loggers: catcherror, error, warn, info : Begin */
const mainLogFile = `${instanceRunLogFilePrefix}.log`;
const applicationErrorsLogFile = `${instanceRunLogFilePrefix}_applicationerrors.log`;
const catchErrorLogFile = `${instanceRunLogFilePrefix}_catcherror.log`;
const unreachableLogFile = `${instanceRunLogFilePrefix}_unreachable.log`;
const severeLogFile = `${instanceRunLogFilePrefix}_severe.log`;
const errorLogFile = `${instanceRunLogFilePrefix}_error.log`;
const warnLogFile = `${instanceRunLogFilePrefix}_warn.log`;
const infoLogFile = `${instanceRunLogFilePrefix}_info.log`;
const verboseFile = `${instanceRunLogFilePrefix}_verbose.log`;
const debugLogFile = `${instanceRunLogFilePrefix}_debug.log`;
const sillyLogFile = `${instanceRunLogFilePrefix}_billy.log`;

const catcherrorFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: levels,
    transports: [
        // new transports.File({
        //     ...fileTransportOptions,
        //     name: 'all',
        //     filename: `${instanceRunLogFilePrefix}.log`,
        //     level: 'catcherror',
        // }),
        // To catch the non catched errors
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'error',
        }),
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions(applicationErrorsLogFile),
            name: 'all',
            filename: applicationErrorsLogFile,
            level: 'error',
        }),
    ],
});

const unreachableFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'unreachable',
    levels: { unreachable: 0 },
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'unreachable',
        }),
    ],
});

const errorFileWinston = createLogger({
    level: 'error',
    levels: levels,
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'error',
        }),
    ],
});

const warnFileWinston = createLogger({
    level: 'warn',
    levels: levels,
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'warn',
        }),
    ],
});

const infoFileWinston = createLogger({
    level: 'info',
    levels: levels,
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'info',
        }),
    ],
});

const verboseFileWinston = createLogger({
    level: 'verbose',
    levels: levels,
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'verbose',
        }),
    ],
});

const debugFileWinston = createLogger({
    level: 'debug',
    levels: levels,
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'debug',
        }),
    ],
});

const billyFileWinston = createLogger({
    level: 'billy',
    levels: levels,
    transports: [
        new transports.File({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'billy',
        }),
    ],
});
/* #endregion File loggers: catcherror, error, warn, info : End */

/* #region Console loggers: catcherror, error, warn, info : Begin */
const catcherrorConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: levels,
    transports: [
        // new transports.Console({
        //     ...consoleTransportOptions,
        //     name: 'catcherror',
        //     level: 'catcherror',
        // }),
        new transports.Console({
            handleExceptions: true,
            ...consoleTransportOptions,
            name: 'error',
            level: 'error',
        }),
    ],
});

const unreachableConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'unreachable',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'unreachable',
            level: 'unreachable',
        }),
    ],
});

const errorConsoleWinston = createLogger({
    level: 'error',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'error',
            level: 'error',
        }),
    ],
});

const warnConsoleWinston = createLogger({
    level: 'warn',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'warn',
            level: 'warn',
        }),
    ],
});

const infoConsoleWinston = createLogger({
    level: 'info',
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'info',
            level: 'info',
        }),
    ],
});

const verboseConsoleWinston = createLogger({
    level: 'verbose',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'verbose',
            level: 'verbose',
        }),
    ],
});

const debugConsoleWinston = createLogger({
    level: 'debug',
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'debug',
            level: 'debug',
        }),
    ],
});

const billyConsoleWinston = createLogger({
    level: 'billy',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'billy',
            level: 'billy',
        }),
    ],
});
/* #endregion Console loggers: catcherror, error, warn, info : End */

/* #region addIndividualTransport Functions : Begin */
let isIndividualTransportCatcherrorFileWinstonEnabled = false;
function addIndividualTransportCatcherrorFileWinston() {
    if (!isIndividualTransportCatcherrorFileWinstonEnabled) {
        catcherrorFileWinston.add(
            new transports.File({
                ...fileTransportOptions(catchErrorLogFile),
                name: 'catcherror',
                filename: catchErrorLogFile,
                level: 'catcherror',
            })
        );
        isIndividualTransportCatcherrorFileWinstonEnabled = true;
    }
}

let isIndividualTransportUnreachableFileWinstonEnabled = false;
function addIndividualTransportUnreachableFileWinston() {
    if (!isIndividualTransportUnreachableFileWinstonEnabled) {
        unreachableFileWinston.add(
            new transports.File({
                ...fileTransportOptions(unreachableLogFile),
                name: 'unreachable',
                filename: unreachableLogFile,
                level: 'unreachable',
            })
        );
        isIndividualTransportUnreachableFileWinstonEnabled = true;
    }
}

let isIndividualTransportErrorFileWinstonEnabled = false;
function addIndividualTransportErrorFileWinston() {
    if (!isIndividualTransportErrorFileWinstonEnabled) {
        errorFileWinston.add(
            new transports.File({
                ...fileTransportOptions(errorLogFile),
                name: 'error',
                filename: errorLogFile,
                level: 'error',
            })
        );
        isIndividualTransportErrorFileWinstonEnabled = true;
    }
}

let isIndividualTransportWarnFileWinstonEnabled = false;
function addIndividualTransportWarnFileWinston() {
    if (!isIndividualTransportWarnFileWinstonEnabled) {
        warnFileWinston.add(
            new transports.File({
                ...fileTransportOptions(warnLogFile),
                name: 'warn',
                filename: warnLogFile,
                level: 'warn',
            })
        );
        isIndividualTransportWarnFileWinstonEnabled = true;
    }
}

let isIndividualTransportInfoFileWinstonEnabled = false;
function addIndividualTransportInfoFileWinston() {
    if (!isIndividualTransportInfoFileWinstonEnabled) {
        infoFileWinston.add(
            new transports.File({
                ...fileTransportOptions(infoLogFile),
                name: 'info',
                filename: infoLogFile,
                level: 'info',
            })
        );
        isIndividualTransportInfoFileWinstonEnabled = true;
    }
}

let isIndividualTransportVerboseFileWinstonEnabled = false;
function addIndividualTransportVerboseFileWinston() {
    if (!isIndividualTransportVerboseFileWinstonEnabled) {
        verboseFileWinston.add(
            new transports.File({
                ...fileTransportOptions(verboseFile),
                name: 'verbose',
                filename: verboseFile,
                level: 'verbose',
            })
        );
        isIndividualTransportVerboseFileWinstonEnabled = true;
    }
}

let isIndividualTransportDebugFileWinstonEnabled = false;
function addIndividualTransportDebugFileWinston() {
    if (!isIndividualTransportDebugFileWinstonEnabled) {
        debugFileWinston.add(
            new transports.File({
                ...fileTransportOptions(debugLogFile),
                name: 'debug',
                filename: debugLogFile,
                level: 'debug',
            })
        );
        isIndividualTransportDebugFileWinstonEnabled = true;
    }
}

let isIndividualTransportBillyFileWinstonEnabled = false;
function addIndividualTransportBillyFileWinston() {
    if (!isIndividualTransportBillyFileWinstonEnabled) {
        billyFileWinston.add(
            new transports.File({
                ...fileTransportOptions(sillyLogFile),
                name: 'billy',
                filename: sillyLogFile,
                level: 'billy',
            })
        );
        isIndividualTransportBillyFileWinstonEnabled = true;
    }
}
/* #endregion addIndividualTransport Functions : End */

/* #region Main logger functions: loggerFile, loggerConsole : Begin */
const loggerFile = {
    catcherror: (...args) => {
        // console.log('Logger File CatchError');
        catcherrorFileWinston.catcherror(...args);
    },
    unreachable: (...args) => {
        // console.log('Logger File Unreachable');
        unreachableFileWinston.unreachable(...args);
    },
    error: (...args) => {
        // console.log('Logger File Erro');
        errorFileWinston.error(...args);
    },
    warn: (...args) => {
        // console.log('Logger File Warn');
        warnFileWinston.warn(...args);
    },
    info: (...args) => {
        // console.log('Logger File Info');
        infoFileWinston.info(...args);
    },
    verbose: (...args) => {
        // console.log('Logger File Verbose');
        verboseFileWinston.verbose(...args);
    },
    debug: (...args) => {
        // console.log('Logger File Debug');
        debugFileWinston.debug(...args);
    },
    billy: (...args) => {
        // console.log('Logger File Billy');
        billyFileWinston.billy(...args);
    },
};

const loggerConsole = {
    catcherror: (...args) => {
        // console.log('Logger Console CatchError');
        catcherrorConsoleWinston.catcherror(...args);
    },
    unreachable: (...args) => {
        // console.log('Logger Console Unreachable');
        unreachableConsoleWinston.unreachable(...args);
    },
    error: (...args) => {
        // console.log('Logger Console Error');
        errorConsoleWinston.error(...args);
    },
    warn: (...args) => {
        // console.log('Logger Console Warn');
        warnConsoleWinston.warn(...args);
    },
    info: (...args) => {
        // console.log('Logger Console Info');
        infoConsoleWinston.info(...args);
    },
    verbose: (...args) => {
        // console.log('Logger Console Verbose');
        verboseConsoleWinston.verbose(...args);
    },
    debug: (...args) => {
        // console.log('Logger Console Debug');
        debugConsoleWinston.debug(...args);
    },
    billy: (...args) => {
        // console.log('Logger Console Billy');
        billyConsoleWinston.billy(...args);
    },
};
/* #endregion Main logger functions: loggerFile, loggerConsole : End */

// #region
// Set logger level based on environment variable (default to info)
// logger.level = process.env.LOG_LEVEL || 'info';
loggerFile.level = process.env.LOG_LEVEL || 'billy';
loggerConsole.level = process.env.LOG_LEVEL || 'billy';

// // Rotate logs and persist logs with warn, error, fatal on disk
// setInterval(() => {
//     logger.info('Rotating logs');
//     logger.flush();
// }, 24 * 60 * 60 * 1000); // Rotate logs once per day
// #endregion

// eslint-disable-next-line import/prefer-default-export
export {
    loggerFile,
    loggerConsole,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportBillyFileWinston,
};
