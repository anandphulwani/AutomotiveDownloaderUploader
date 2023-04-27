/* eslint-disable import/extensions */
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportCatcherrorConsoleWinston,
    addIndividualTransportErrorConsoleWinston,
    addIndividualTransportWarnConsoleWinston,
    addIndividualTransportInfoConsoleWinston,
} from './logger.js';

const lgc = async (...args) => {
    addIndividualTransportCatcherrorConsoleWinston();
    loggerConsole.catcherror(...args);
    loggerFile.catcherror(...args);
};

const lge = (...args) => {
    addIndividualTransportErrorConsoleWinston();
    loggerConsole.error(...args);
    loggerFile.error(...args);
};

const lgw = (...args) => {
    addIndividualTransportWarnConsoleWinston();
    loggerConsole.warn(...args);
    loggerFile.warn(...args);
};

const lgi = (...args) => {
    addIndividualTransportInfoConsoleWinston();
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
