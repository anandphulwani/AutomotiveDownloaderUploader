import { createLogger, format, transports } from 'winston';
import { combine, timestamp, printf } from 'logform';
// import { generateUniqueId } from './utils';

// Define log message format
const logFormat = printf(({ level, message, uniqueId, timestamp: ts }) => `${ts} [${level.toUpperCase()}] [${uniqueId}] ${message}`);

// Define transport options for logging to file
const fileTransportOptions = {
    filename: `logs/${new Date().toISOString().slice(0, 10)}/application.log`,
    level: 'info',
    handleExceptions: true,
    format: combine(
        timestamp(),
        format((info, opts) => {
            info.uniqueId = ''; // generateUniqueId();
            return info;
        })(),
        logFormat
    ),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true,
};

// Define transport options for logging to console
const consoleTransportOptions = {
    level: 'info',
    handleExceptions: true,
    format: combine(
        format((info, opts) => {
            info.uniqueId = ''; // generateUniqueId();
            return info;
        })(),
        format.colorize(),
        format((info, opts) => {
            delete info.timestamp;
            return info;
        })(),
        logFormat
    ),
};

// Create logger with custom levels and transports
const logger = createLogger({
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 3,
        debug: 4,
        // silly: 5,
    },
    transports: [new transports.File(fileTransportOptions), new transports.Console(consoleTransportOptions)],
});

// Only log warn, error, and fatal to file
logger.add(
    new transports.File({
        ...fileTransportOptions,
        level: 'warn',
        filename: `logs/${new Date().toISOString().slice(0, 10)}/error.log`,
    })
);

const lge = (...args) => {
    logger.error(...args);
};

const lgw = (...args) => {
    logger.warn(...args);
};

const lgi = (...args) => {
    logger.info(...args);
};

const lgv = (...args) => {
    logger.verbose(...args);
};

const lgd = (...args) => {
    logger.debug(...args);
};

// Set logger level based on environment variable (default to info)
logger.level = process.env.LOG_LEVEL || 'info';

export { lge, lgw, lgi, lgv, lgd };

// const logger = winston.createLogger({
//     level: 'info',
//     format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
//     transports: [
//         new winston.transports.Console(),
//         new winston.transports.File({ filename: 'error.log', level: 'error' }),
//         new winston.transports.File({ filename: 'combined.log' }),
//     ],
// });

// // import logger from './logger.js';

// const lgi = (...args) => {
//     logger.info(...args);
// };

// logger.info('This is an information message.');
// logger.error('This is an error message.');

// export default logger;
