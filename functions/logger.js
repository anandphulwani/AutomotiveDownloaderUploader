import date from 'date-and-time';
import chalk from 'chalk';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, errors } = format;
const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
const todaysDateWithTime = date.format(new Date(), 'YYYYMMDD-HHmmss');

// #region
// Define log functions
const timezoned = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');

/* #region logFormatFile and logFormatConsole : Begin */
const logFormatFile = printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
    const { filename, lineNumber, uniqueId } = sp !== undefined ? sp.slice(-1)[0] : { filename: '', lineNumber: '', uniqueId: '' };
    let logMesg = [];
    ts !== undefined ? logMesg.push(ts) : null;
    uniqueId !== undefined ? logMesg.push(`[${uniqueId}]`) : null;
    logMesg.push(`[${level.toUpperCase() === 'WARN' ? 'WARNING' : level.toUpperCase()}]`.padEnd(12, ' '));
    logMesg.push(`${message} (${filename}:${lineNumber})`);
    logMesg = logMesg.join(' ');
    if (stack) {
        logMesg = `${logMesg}\n${stack}`;
    }
    return logMesg;
});

const logFormatConsole = printf(({ level, message, timestamp: ts, stack, [Symbol.for('splat')]: sp }) => {
    const { filename, lineNumber, uniqueId } = sp !== undefined ? sp.slice(-1)[0] : { filename: '', lineNumber: '', uniqueId: '' };
    let logMesg = [];
    ts !== undefined ? logMesg.push(ts) : null;
    if (level === 'catcherror') {
        uniqueId !== undefined ? logMesg.push(`[${uniqueId}]`) : null;
    }
    let levelToPrint = '';
    if (level === 'warn') {
        levelToPrint = 'warning';
    } else if (level === 'info') {
        levelToPrint = '';
    } else {
        levelToPrint = level;
    }
    logMesg.push(`${levelToPrint}:`.toUpperCase());
    if (level === 'info') {
        logMesg.push(message);
    } else {
        logMesg.push(message);
        // logMesg.push(`${message} (${filename}:${lineNumber})`);
    }
    logMesg = logMesg.join(' ');
    logMesg = logMesg.padEnd(120, ' ');
    if (level === 'catcherror') {
        stack = stack.split('\n');
        stack = stack.map((line) => line.padEnd(120, ' '));
        stack = stack.join('\n');
        logMesg = `${chalk.bgRed.white(logMesg)}\n${chalk.bgRedBright.white(stack)}`;
    } else if (level === 'error') {
        logMesg = chalk.white.bgRed.bold(logMesg);
    } else if (level === 'warn') {
        logMesg = chalk.white.bgYellow.bold(logMesg);
    } else if (level === 'info') {
        logMesg = chalk.cyan(logMesg);
    } else {
        logMesg = chalk.inverse(logMesg);
    }
    return logMesg;
});
/* #endregion logFormatFile and logFormatConsole : End */

/* #region fileTransportOptions and consoleTransportOptions : Begin */
const fileTransportOptions = {
    handleExceptions: true,
    format: combine(timestamp({ format: timezoned }), errors({ stack: true }), logFormatFile),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true,
};

// Define transport options for logging to console
const consoleTransportOptions = {
    handleExceptions: true,
    format: combine(
        timestamp({ format: timezoned }),
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
    levels: { catcherror: 0 },
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}.log`,
            level: 'catcherror',
        }),
    ],
});

const errorFileWinston = createLogger({
    level: 'error',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}.log`,
            level: 'error',
        }),
    ],
});

const warnFileWinston = createLogger({
    level: 'warn',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}.log`,
            level: 'warn',
        }),
    ],
});

const infoFileWinston = createLogger({
    level: 'info',
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.File({
            handleExceptions: true,
            ...fileTransportOptions,
            name: 'all',
            filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}.log`,
            level: 'info',
        }),
    ],
});
/* #endregion File loggers: catcherror, error, warn, info : End */

/* #region Console loggers: catcherror, error, warn, info : Begin */
const catcherrorConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: { catcherror: 0 },
    defaultMeta: { service: 'log-service' },
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'catcherror',
            level: 'catcherror',
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
/* #endregion Console loggers: catcherror, error, warn, info : End */

/* #region addIndividualTransport Functions : Begin */
let isIndividualTransportCatcherrorFileWinstonEnabled = false;
function addIndividualTransportCatcherrorFileWinston() {
    if (!isIndividualTransportCatcherrorFileWinstonEnabled) {
        catcherrorFileWinston.add(
            new transports.File({
                handleExceptions: true,
                ...fileTransportOptions,
                name: 'catcherror',
                filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}_catcherror.log`,
                level: 'catcherror',
            })
        );
        isIndividualTransportCatcherrorFileWinstonEnabled = true;
    }
}

let isIndividualTransportErrorFileWinstonEnabled = false;
function addIndividualTransportErrorFileWinston() {
    if (!isIndividualTransportErrorFileWinstonEnabled) {
        errorFileWinston.add(
            new transports.File({
                ...fileTransportOptions,
                name: 'error',
                filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}_error.log`,
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
                filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}_warn.log`,
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
                filename: `.\\logs\\${todaysDate}\\${todaysDateWithTime}_info.log`,
                level: 'info',
            })
        );
        isIndividualTransportInfoFileWinstonEnabled = true;
    }
}
/* #endregion addIndividualTransport Functions : End */

/* #region Main logger functions: loggerFile, loggerConsole : Begin */
const loggerFile = {
    catcherror: (...args) => catcherrorFileWinston.catcherror(...args),
    error: (...args) => errorFileWinston.error(...args),
    warn: (...args) => warnFileWinston.warn(...args),
    info: (...args) => infoFileWinston.info(...args),
};

const loggerConsole = {
    catcherror: (...args) => catcherrorConsoleWinston.catcherror(...args),
    error: (...args) => errorConsoleWinston.error(...args),
    warn: (...args) => warnConsoleWinston.warn(...args),
    info: (...args) => infoConsoleWinston.info(...args),
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
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
};

// new transports.File(fileTransportOptions('verbose', `${todaysDateWithTime}_verbose.log`)),
// new transports.File(fileTransportOptions('debug', `${todaysDateWithTime}_debug.log`)),
// new transports.File(fileTransportOptions('silly', `${todaysDateWithTime}_silly.log`)),
