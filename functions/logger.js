import { createLogger, format, transports } from 'winston';

/* eslint-disable import/extensions */
import { currentDateTimeReadableFormatted } from './datetime.js';
import { instanceRunLogFilePrefix } from './loggervariables.js';
import { logFormatFile, logFormatConsole } from './loggerlogformats.js';
import LoggerCustomFileSyncTransport from '../class/LoggerCustomFileSyncTransport.js';
/* eslint-enable import/extensions */

const { combine, timestamp, errors } = format;
const levels = {
    unhandledexception: 0,
    unreachable: 1,
    catcherror: 2,
    severe: 3,
    error: 4,
    hiccup: 5,
    warn: 6,
    info: 7,
    verbose: 8,
    billy: 9,
    debug: 10,
    trace: 11,
};

// Set logger level based on environment variable (default to billy)
const loggerFileLevel = process.env.LOG_LEVEL || 'billy';
const loggerConsoleLevel = process.env.LOG_LEVEL || 'billy';

/* #region fileTransportOptions and consoleTransportOptions : Begin */
const fileTransportOptions = (logFilename) => ({
    format: combine(
        timestamp({ format: currentDateTimeReadableFormatted() }),
        errors({ stack: true }),
        format((info) => {
            if (info.message.startsWith('uncaughtException: ')) {
                info.message = info.message.replace(/^uncaughtException: /, '');
                info.level = 'unhandledexception';
            }
            return info;
        })(),
        logFormatFile(logFilename)
    ),
    eol: '',
    // maxsize: 10485760, // 10MB
    // maxFiles: 5,
    // tailable: true,
});

// Define transport options for logging to console
const consoleTransportOptions = {
    format: combine(
        timestamp({ format: currentDateTimeReadableFormatted() }),
        errors({ stack: true }),
        format((info) => {
            delete info.timestamp;
            if (info.message.startsWith('uncaughtException: ')) {
                info.message = info.message.replace(/^uncaughtException: /, '');
                info.level = 'unhandledexception';
            }
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
const userErrorsLogFile = `${instanceRunLogFilePrefix}_usererrors.log`;
const unhandledexceptionLogFile = `${instanceRunLogFilePrefix}_unhandledexception.log`;
const unreachableLogFile = `${instanceRunLogFilePrefix}_unreachable.log`;
const catchErrorLogFile = `${instanceRunLogFilePrefix}_catcherror.log`;
const severeLogFile = `${instanceRunLogFilePrefix}_severe.log`;
const errorLogFile = `${instanceRunLogFilePrefix}_error.log`;
const hiccupLogFile = `${instanceRunLogFilePrefix}_hiccup.log`;
const warnLogFile = `${instanceRunLogFilePrefix}_warn.log`;
const infoLogFile = `${instanceRunLogFilePrefix}_info.log`;
const verboseFile = `${instanceRunLogFilePrefix}_verbose.log`;
const debugLogFile = `${instanceRunLogFilePrefix}_debug.log`;
const traceLogFile = `${instanceRunLogFilePrefix}_trace.log`;
const billyLogFile = `${instanceRunLogFilePrefix}_billy.log`;

// TODO: Check unhandledexceptionFileWinston's: `handleExceptions: true` parameter, not being handled in `LoggerCustomFileSyncTransport.js`.
const unhandledexceptionFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'unhandledexception',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            handleExceptions: true,
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'error',
        }),
        new LoggerCustomFileSyncTransport({
            handleExceptions: true,
            ...fileTransportOptions(unhandledexceptionLogFile),
            name: 'all',
            filename: unhandledexceptionLogFile,
            level: 'error',
        }),
        new LoggerCustomFileSyncTransport({
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
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'unreachable',
        }),
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(applicationErrorsLogFile),
            name: 'all',
            filename: applicationErrorsLogFile,
            level: 'unreachable',
        }),
    ],
});

const catcherrorFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'catcherror',
        }),
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(applicationErrorsLogFile),
            name: 'all',
            filename: applicationErrorsLogFile,
            level: 'catcherror',
        }),
    ],
});

const severeFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'severe',
    levels: levels,
    transports: [
        // To catch the non catched errors
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'severe',
        }),
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(applicationErrorsLogFile),
            name: 'all',
            filename: applicationErrorsLogFile,
            level: 'severe',
        }),
    ],
});

const errorFileWinston = createLogger({
    level: 'error',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'error',
        }),
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(userErrorsLogFile),
            name: 'all',
            filename: userErrorsLogFile,
            level: 'error',
        }),
    ],
});

const hiccupFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'hiccup',
    levels: levels,
    transports: [
        // To catch the non catched errors
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'hiccup',
        }),
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(userErrorsLogFile),
            name: 'all',
            filename: userErrorsLogFile,
            level: 'hiccup',
        }),
    ],
});

const warnFileWinston = createLogger({
    level: 'warn',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'warn',
        }),
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(userErrorsLogFile),
            name: 'all',
            filename: userErrorsLogFile,
            level: 'warn',
        }),
    ],
});

const infoFileWinston = createLogger({
    level: 'info',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
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
        new LoggerCustomFileSyncTransport({
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
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'debug',
        }),
    ],
});

const traceFileWinston = createLogger({
    format: fileTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, fileTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'trace',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'trace',
        }),
    ],
});

const billyFileWinston = createLogger({
    level: 'billy',
    levels: levels,
    transports: [
        new LoggerCustomFileSyncTransport({
            ...fileTransportOptions(mainLogFile),
            name: 'all',
            filename: mainLogFile,
            level: 'billy',
        }),
    ],
});
/* #endregion File loggers: catcherror, error, warn, info : End */

/* #region Console loggers: catcherror, error, warn, info : Begin */
const unhandledexceptionConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'unhandledexception',
    levels: levels,
    transports: [
        new transports.Console({
            handleExceptions: true,
            ...consoleTransportOptions,
            name: 'unhandledexception',
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

const catcherrorConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'catcherror',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'error',
            level: 'error',
        }),
    ],
});

const severeConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'severe',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'severe',
            level: 'severe',
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

const hiccupConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'hiccup',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'hiccup',
            level: 'hiccup',
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

const traceConsoleWinston = createLogger({
    format: consoleTransportOptions.format, // LANGUAGEBUG:: this line has to be removed, once the bug resolves, this line is no longer required, consoleTransportOptions are defined below in transport but errors({ stack: true }) is ignored in that, BUG: https://github.com/winstonjs/winston/issues/1880
    level: 'trace',
    levels: levels,
    transports: [
        new transports.Console({
            ...consoleTransportOptions,
            name: 'trace',
            level: 'trace',
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
let isIndividualTransportUnreachableFileWinstonEnabled = false;
function addIndividualTransportUnreachableFileWinston() {
    if (!isIndividualTransportUnreachableFileWinstonEnabled) {
        unreachableFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(unreachableLogFile),
                name: 'unreachable',
                filename: unreachableLogFile,
                level: 'unreachable',
            })
        );
        isIndividualTransportUnreachableFileWinstonEnabled = true;
    }
}

let isIndividualTransportCatcherrorFileWinstonEnabled = false;
function addIndividualTransportCatcherrorFileWinston() {
    if (!isIndividualTransportCatcherrorFileWinstonEnabled) {
        catcherrorFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(catchErrorLogFile),
                name: 'catcherror',
                filename: catchErrorLogFile,
                level: 'catcherror',
            })
        );
        isIndividualTransportCatcherrorFileWinstonEnabled = true;
    }
}

let isIndividualTransportSevereFileWinstonEnabled = false;
function addIndividualTransportSevereFileWinston() {
    if (!isIndividualTransportSevereFileWinstonEnabled) {
        severeFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(severeLogFile),
                name: 'severe',
                filename: severeLogFile,
                level: 'severe',
            })
        );
        isIndividualTransportSevereFileWinstonEnabled = true;
    }
}

let isIndividualTransportErrorFileWinstonEnabled = false;
function addIndividualTransportErrorFileWinston() {
    if (!isIndividualTransportErrorFileWinstonEnabled) {
        errorFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(errorLogFile),
                name: 'error',
                filename: errorLogFile,
                level: 'error',
            })
        );
        isIndividualTransportErrorFileWinstonEnabled = true;
    }
}

let isIndividualTransportHiccupFileWinstonEnabled = false;
function addIndividualTransportHiccupFileWinston() {
    if (!isIndividualTransportHiccupFileWinstonEnabled) {
        hiccupFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(hiccupLogFile),
                name: 'hiccup',
                filename: hiccupLogFile,
                level: 'hiccup',
            })
        );
        isIndividualTransportHiccupFileWinstonEnabled = true;
    }
}

let isIndividualTransportWarnFileWinstonEnabled = false;
function addIndividualTransportWarnFileWinston() {
    if (!isIndividualTransportWarnFileWinstonEnabled) {
        warnFileWinston.add(
            new LoggerCustomFileSyncTransport({
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
            new LoggerCustomFileSyncTransport({
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
            new LoggerCustomFileSyncTransport({
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
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(debugLogFile),
                name: 'debug',
                filename: debugLogFile,
                level: 'debug',
            })
        );
        isIndividualTransportDebugFileWinstonEnabled = true;
    }
}

let isIndividualTransportTraceFileWinstonEnabled = false;
function addIndividualTransportTraceFileWinston() {
    if (!isIndividualTransportTraceFileWinstonEnabled) {
        traceFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(traceLogFile),
                name: 'trace',
                filename: traceLogFile,
                level: 'trace',
            })
        );
        isIndividualTransportTraceFileWinstonEnabled = true;
    }
}

let isIndividualTransportBillyFileWinstonEnabled = false;
function addIndividualTransportBillyFileWinston() {
    if (!isIndividualTransportBillyFileWinstonEnabled) {
        billyFileWinston.add(
            new LoggerCustomFileSyncTransport({
                ...fileTransportOptions(billyLogFile),
                name: 'billy',
                filename: billyLogFile,
                level: 'billy',
            })
        );
        isIndividualTransportBillyFileWinstonEnabled = true;
    }
}
/* #endregion addIndividualTransport Functions : End */

/* #region Main logger functions: loggerFile, loggerConsole : Begin */
const loggerFile = {
    unreachable: (...args) => {
        // console.log('Logger File Unreachable');
        unreachableFileWinston.unreachable(...args);
    },
    catcherror: (...args) => {
        // console.log('Logger File CatchError');
        catcherrorFileWinston.catcherror(...args);
    },
    severe: (...args) => {
        // console.log('Logger File Severe');
        severeFileWinston.severe(...args);
    },
    error: (...args) => {
        // console.log('Logger File Error');
        errorFileWinston.error(...args);
    },
    hiccup: (...args) => {
        // console.log('Logger File Hiccup');
        hiccupFileWinston.hiccup(...args);
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
    trace: (...args) => {
        // console.log('Logger File Trace');
        traceFileWinston.trace(...args);
    },
    billy: (...args) => {
        // console.log('Logger File Billy');
        billyFileWinston.billy(...args);
    },
};

const loggerConsole = {
    unreachable: (...args) => {
        // console.log('Logger Console Unreachable');
        unreachableConsoleWinston.unreachable(...args);
    },
    catcherror: (...args) => {
        // console.log('Logger Console CatchError');
        catcherrorConsoleWinston.catcherror(...args);
    },
    severe: (...args) => {
        // console.log('Logger Console Severe');
        severeConsoleWinston.severe(...args);
    },
    error: (...args) => {
        // console.log('Logger Console Error');
        errorConsoleWinston.error(...args);
    },
    hiccup: (...args) => {
        // console.log('Logger Console Hiccup');
        hiccupConsoleWinston.hiccup(...args);
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
    trace: (...args) => {
        // console.log('Logger Console Trace');
        traceConsoleWinston.trace(...args);
    },
    billy: (...args) => {
        // console.log('Logger Console Billy');
        billyConsoleWinston.billy(...args);
    },
};
/* #endregion Main logger functions: loggerFile, loggerConsole : End */

// #region
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
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportSevereFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportHiccupFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportTraceFileWinston,
    addIndividualTransportBillyFileWinston,
};
