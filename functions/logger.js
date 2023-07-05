import chalk from 'chalk';
import { createLogger, format, transports } from 'winston';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted, instanceRunDateTimeWOMSFormatted, currentDateTimeReadableFormatted } from './datetime.js';
/* eslint-enable import/extensions */

const { combine, timestamp, printf, errors } = format;

// Define log functions
/* #region logFormatFile and logFormatConsole : Begin */
const logFormatFile = printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
    // console.log(`logFormatFile Called, level:${level}`);
    const { filename, lineNumber, uniqueId } = sp !== undefined ? sp.slice(-1)[0] : { filename: '', lineNumber: '', uniqueId: '' };
    let logMesg = [];
    ts !== undefined ? logMesg.push(ts) : null;
    uniqueId !== undefined ? logMesg.push(`[${uniqueId}]`) : null;
    logMesg.push(`[${level.toUpperCase() === 'WARN' ? 'WARNING' : level.toUpperCase()}]`.padEnd(13, ' '));
    if (sp === undefined) {
        logMesg.push(`${message})`);
    } else {
        logMesg.push(`${message} (${filename}:${lineNumber})`);
    }
    logMesg = logMesg.join(' ');
    if (stack !== undefined && !logMesg.includes(stack)) {
        logMesg = `${logMesg}\n${stack}`;
    }
    return logMesg;
});

const logFormatConsole = printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
    // console.log(`logFormatConsole Called, level:${level}`);
    const { filename, lineNumber, uniqueId } = sp !== undefined ? sp.slice(-1)[0] : { filename: '', lineNumber: '', uniqueId: '' };
    let logMesg = [];
    ts !== undefined ? logMesg.push(ts) : null;
    if (level === 'catcherror' || level === 'unreachable') {
        uniqueId !== undefined ? logMesg.push(`[${uniqueId}]`) : null;
    }
    if (stack !== undefined && stack.length > 0) {
        const stackArray = stack.split('\n');
        const errorString = stackArray[0].replace(/^[a-zA-Z]*Error:/, '').trim();
        message = message.replace(errorString, `\n${errorString}`);
    }
    let levelToPrint = '';
    if (level === 'warn') {
        levelToPrint = 'warning';
    } else if (level === 'info') {
        levelToPrint = '';
    } else {
        levelToPrint = level;
    }
    if (level === 'info') {
        logMesg.push(message);
    } else {
        logMesg.push(`${levelToPrint}:`.toUpperCase());
        logMesg.push(message);
        // logMesg.push(`${message} (${filename}:${lineNumber})`);
    }
    logMesg = logMesg.join(' ');
    logMesg = logMesg.padEnd(120, ' ');
    if (level === 'catcherror') {
        logMesg = chalk.bgRed.white(logMesg);
        if (stack !== undefined) {
            stack = stack.split('\n');
            stack = stack.map((line) => line.padEnd(120, ' '));
            stack = stack.join('\n');
            logMesg += `\n${chalk.bgRedBright.white(stack)}`;
        }
    } else if (level === 'unreachable') {
        logMesg = chalk.white.bgRedBright.bold(logMesg);
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
    } else if (level === 'silly') {
        logMesg = chalk.bgWhite.bold(logMesg);
    } else {
        logMesg = chalk.inverse(logMesg);
    }
    return logMesg;
});
/* #endregion logFormatFile and logFormatConsole : End */

/* #region fileTransportOptions and consoleTransportOptions : Begin */
const fileTransportOptions = {
    format: combine(timestamp({ format: currentDateTimeReadableFormatted }), errors({ stack: true }), logFormatFile),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true,
};

// Define transport options for logging to console
const consoleTransportOptions = {
    format: combine(
        timestamp({ format: currentDateTimeReadableFormatted }),
        errors({ stack: true }),
        format((info) => {
            delete info.timestamp;
            return info;
        })(),
        logFormatConsole
    ),
};
/* #endregion fileTransportOptions and consoleTransportOptions : End */

/* #region File loggers: catcherror, error, warn, info : Begin */
const catcherrorFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: { catcherror: 0, error: 1 },
    defaultMeta: { service: 'log-service' },
    transports: [
        // new transports.File({
        //     ...fileTransportOptions,
        //     name: 'all',
        //     filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
        //     level: 'catcherror',
        // }),
        // To catch the non catched errors
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'error',
        }),
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_noncatcherror.log`,
            level: 'error',
        }),
    ],
});

const unreachableFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'unreachable',
    levels: { unreachable: 0 },
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'unreachable',
        }),
    ],
});

const errorFileWinston = createLogger({
    level: 'error',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'error',
        }),
    ],
});

const warnFileWinston = createLogger({
    level: 'warn',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'warn',
        }),
    ],
});

const infoFileWinston = createLogger({
    level: 'info',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'info',
        }),
    ],
});

const verboseFileWinston = createLogger({
    level: 'verbose',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'verbose',
        }),
    ],
});

const debugFileWinston = createLogger({
    level: 'debug',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'debug',
        }),
    ],
});

const sillyFileWinston = createLogger({
    level: 'silly',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}.log`,
            level: 'silly',
        }),
    ],
});
/* #endregion File loggers: catcherror, error, warn, info : End */

/* #region Console loggers: catcherror, error, warn, info : Begin */
const catcherrorConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: { catcherror: 0, error: 1 },
    defaultMeta: { service: 'log-service' },
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
    levels: { unreachable: 0 },
    defaultMeta: { service: 'log-service' },
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
    defaultMeta: { service: 'log-service' },
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
    defaultMeta: { service: 'log-service' },
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
    defaultMeta: { service: 'log-service' },
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
    defaultMeta: { service: 'log-service' },
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
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'debug',
            level: 'debug',
        }),
    ],
});

const sillyConsoleWinston = createLogger({
    level: 'silly',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'silly',
            level: 'silly',
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
                ...fileTransportOptions,
                name: 'catcherror',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_catcherror.log`,
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
                ...fileTransportOptions,
                name: 'unreachable',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_unreachable.log`,
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
                ...fileTransportOptions,
                name: 'error',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_error.log`,
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
                ...fileTransportOptions,
                name: 'warn',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_warn.log`,
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
                ...fileTransportOptions,
                name: 'info',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_info.log`,
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
                ...fileTransportOptions,
                name: 'verbose',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_verbose.log`,
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
                ...fileTransportOptions,
                name: 'debug',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_debug.log`,
                level: 'debug',
            })
        );
        isIndividualTransportDebugFileWinstonEnabled = true;
    }
}

let isIndividualTransportSillyFileWinstonEnabled = false;
function addIndividualTransportSillyFileWinston() {
    if (!isIndividualTransportSillyFileWinstonEnabled) {
        sillyFileWinston.add(
            new transports.File({
                ...fileTransportOptions,
                name: 'silly',
                filename: `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeWOMSFormatted}_silly.log`,
                level: 'silly',
            })
        );
        isIndividualTransportSillyFileWinstonEnabled = true;
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
    silly: (...args) => {
        // console.log('Logger File Silly');
        sillyFileWinston.silly(...args);
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
    silly: (...args) => {
        // console.log('Logger Console Silly');
        sillyConsoleWinston.silly(...args);
    },
};
/* #endregion Main logger functions: loggerFile, loggerConsole : End */

// #region
// Set logger level based on environment variable (default to info)
// logger.level = process.env.LOG_LEVEL || 'info';
loggerFile.level = process.env.LOG_LEVEL || 'silly';
loggerConsole.level = process.env.LOG_LEVEL || 'silly';

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
    addIndividualTransportSillyFileWinston,
};
