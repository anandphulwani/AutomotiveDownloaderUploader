/* eslint-disable import/extensions */
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportCatcherrorConsoleWinston,
    addIndividualTransportErrorConsoleWinston,
    addIndividualTransportWarnConsoleWinston,
    addIndividualTransportInfoConsoleWinston,
} from './logger.js';

const addFileInfo = (message, filename, line) => {
    const fileInfo = `${filename}:${line}`;
    return `${message} (${fileInfo})`;
};

const getCallerDetails = () => {
    const stackTrace = new Error().stack.split('\n');
    const stackDetails = stackTrace[3].match(/at (.+)\/(.+?):(\d+):(\d+)/);
    return {
        filename: stackDetails[2],
        lineNumber: stackDetails[3],
    };
};

const lgc = async (...args) => {
    addIndividualTransportCatcherrorConsoleWinston();
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.catcherror(message);
    loggerFile.catcherror(message);
};

const lge = (...args) => {
    addIndividualTransportErrorConsoleWinston();
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.error(message);
    loggerFile.error(message);
};

const lgw = (...args) => {
    addIndividualTransportWarnConsoleWinston();
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.warn(message);
    loggerFile.warn(message);
};

const lgi = (...args) => {
    addIndividualTransportInfoConsoleWinston();
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.info(message);
    loggerFile.info(message);
};

const lgv = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.verbose(message);
    loggerFile.verbose(message);
};

const lgd = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.debug(message);
    loggerFile.debug(message);
};

const lgs = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.silly(message);
    loggerFile.silly(message);
};

// Export log functions
// eslint-disable-next-line import/prefer-default-export
export { lgc, lge, lgw, lgi, lgv, lgd, lgs };
