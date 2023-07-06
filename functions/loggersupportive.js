import chalk from 'chalk';

/* eslint-disable import/extensions */
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportSillyFileWinston,
} from './logger.js';
import { generateAndGetNonCatchErrorLogLevels9DigitUniqueId, generateAndGetCatchErrorLogLevels6DigitUniqueId } from './loggeruniqueidgenerators.js';
/* eslint-enable import/extensions */

const getCallerDetails = (...args) => {
    let stackTrace;
    let filename;
    let lineNumber;
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (arg instanceof Error) {
            stackTrace = arg.stack.split('\n');
            if (stackTrace[0].match(/^[a-zA-Z]*Error:/) || stackTrace[0] === 'Error') {
                stackTrace.shift();
            } else {
                const mesg = `Logger error: Unable to match the first line, it doesnt contain anything like 'Error: ' in the line: \n${stackTrace[0]}\nError Stack:\n${arg.stack}`;
                lgcf(mesg);
                process.exit(1);
            }
            while (stackTrace.length > 0 && stackTrace[0].match(/at (.+)[\\/](.+?):(\d+):(\d+)/) === null) {
                stackTrace.shift();
            }
            if (stackTrace.length > 0) {
                const stackDetailsCatchLine = stackTrace[0].match(/at (.+)[\\/](.+?):(\d+):(\d+)/);
                [, , filename, lineNumber] = stackDetailsCatchLine;
            } else {
                const mesg = `Logger error: Unable to get the filename and linenumber from the following stack: \n${arg.stack}.`;
                lgcf(mesg);
                [filename, lineNumber] = [mesg, ''];
            }
        }
    }
    if (filename === undefined && lineNumber === undefined) {
        stackTrace = new Error().stack.split('\n');
        if (stackTrace[0].match(/^[a-zA-Z]*Error:/) || stackTrace[0] === 'Error') {
            stackTrace.shift();
        } else {
            const mesg = `Logger error: Unable to match the first line, it doesnt contain 'Error: ' in the line: \n${
                stackTrace[0]
            }\nRemaining Error Stack:\n${stackTrace.join('\n')}`;
            console.log(chalk.white.bgRed(mesg));
            process.exit(1);
        }
        while (stackTrace.length > 0 && stackTrace[0].match(/at getCallerDetails(.*)/) !== null) {
            stackTrace.shift();
        }
        if (stackTrace.length > 0) {
            const stackDetailsCatchLine = stackTrace[0].match(/at (.+)[\\/](.+?):(\d+):(\d+)/);
            if (stackDetailsCatchLine) {
                let [, fullFilePath] = stackDetailsCatchLine;
                [, , filename, lineNumber] = stackDetailsCatchLine;
                fullFilePath += `/${filename}`;
                if (stackTrace[1] !== undefined) {
                    const stackDetailsErrorLineInTry = stackTrace[1].match(/at (.+)[\\/](.+?):(\d+):(\d+)/);
                    if (stackDetailsErrorLineInTry) {
                        let [, fullFilePath2ndLine] = stackDetailsErrorLineInTry;
                        const [, , filename2ndLine, lineNumber2ndLine] = stackDetailsErrorLineInTry;
                        fullFilePath2ndLine += `/${filename2ndLine}`;
                        if (fullFilePath === fullFilePath2ndLine) {
                            lineNumber += `,${lineNumber2ndLine}`;
                        }
                    }
                }
            } else {
                const mesg = `Logger error: Unable to get the filename and linenumber from the following line: \n${stackTrace[0]}.`;
                lgcf(mesg); // TODO: Change it to logger error section, which you have to create parallely to lge, lgw, lgi
                filename = mesg;
            }
        } else {
            const mesg = `Logger error: Every line in stacktrace is from getCallerDetails().`;
            lgcf(mesg); // TODO: Change it to logger error section, which you have to create parallely to lge, lgw, lgi
            filename = mesg;
        }
    }
    filename = filename !== undefined ? filename : '';
    lineNumber = lineNumber !== undefined ? lineNumber : '';
    return {
        filename: filename,
        lineNumber: lineNumber,
    };
};

const lgu = (...args) => {
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { filename, lineNumber, uniqueId });
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId });
};

const lgc = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { filename, lineNumber, uniqueId });
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lge = (...args) => {
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { filename, lineNumber, uniqueId });
    loggerFile.error(...args, { filename, lineNumber, uniqueId });
};

const lgw = (...args) => {
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { filename, lineNumber, uniqueId });
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

const lgi = (...args) => {
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { filename, lineNumber, uniqueId });
    loggerFile.info(...args, { filename, lineNumber, uniqueId });
};

const lgv = (...args) => {
    addIndividualTransportVerboseFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { filename, lineNumber, uniqueId });
    loggerFile.verbose(...args, { filename, lineNumber, uniqueId });
};

const lgd = (...args) => {
    addIndividualTransportDebugFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { filename, lineNumber, uniqueId });
    loggerFile.debug(...args, { filename, lineNumber, uniqueId });
};

const lgs = (...args) => {
    addIndividualTransportSillyFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.silly(...args, { filename, lineNumber, uniqueId });
    loggerFile.silly(...args, { filename, lineNumber, uniqueId });
};

const lguf = (...args) => {
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId });
};

const lgcf = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lgef = (...args) => {
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { filename, lineNumber, uniqueId });
};

const lgwf = (...args) => {
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

const lgif = (...args) => {
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { filename, lineNumber, uniqueId });
};

const lgvf = (...args) => {
    addIndividualTransportVerboseFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { filename, lineNumber, uniqueId });
};

const lgdf = (...args) => {
    addIndividualTransportDebugFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { filename, lineNumber, uniqueId });
};

const lgsf = (...args) => {
    addIndividualTransportSillyFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.silly(...args, { filename, lineNumber, uniqueId });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lge, lgw, lgi, lgv, lgd, lgs, lgcf, lguf, lgef, lgwf, lgif, lgvf, lgdf, lgsf };
