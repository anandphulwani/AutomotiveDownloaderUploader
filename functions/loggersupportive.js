// eslint-disable-next-line import/extensions
import { loggerFile, loggerConsole } from './logger.js';

const lgc = (...args) => {
    loggerConsole.catcherror(...args);
    loggerFile.catcherror(...args);
};

const lge = (...args) => {
    loggerConsole.error(...args);
    loggerFile.error(...args);
};

const lgw = (...args) => {
    loggerConsole.warn(...args);
    loggerFile.warn(...args);
};

const lgi = (...args) => {
    loggerConsole.info(...args);
    loggerFile.info(...args);
};

const lgv = (...args) => {
    loggerConsole.verbose(...args);
    loggerFile.verbose(...args);
};

const lgd = (...args) => {
    loggerConsole.debug(...args);
    loggerFile.debug(...args);
};

const lgs = (...args) => {
    loggerConsole.silly(...args);
    loggerFile.silly(...args);
};

// Export log functions
// eslint-disable-next-line import/prefer-default-export
export { lgc, lge, lgw, lgi, lgv, lgd, lgs };
