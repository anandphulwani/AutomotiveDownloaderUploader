import chalk from 'chalk';

/* eslint-disable import/extensions */
import { lgccyclicdependency } from './loggercyclicdependency.js';
/* eslint-enable import/extensions */

const getCallerDetailsList = (...args) => {
    let stackTrace;
    let functionName;
    let pathToFile;
    let filename;
    let lineNumber;
    let columnNumber;
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (arg instanceof Error) {
            stackTrace = arg.stack.split('\n');
            if (stackTrace[0].match(/^[a-zA-Z]*Error:/) || stackTrace[0] === 'Error') {
                stackTrace.shift();
            } else {
                const mesg = `Logger error: Unable to match the first line, it doesnt contain anything like 'Error: ' in the line: \n${stackTrace[0]}\nError Stack:\n${arg.stack}`;
                lgccyclicdependency(mesg);
                process.exit(1);
            }
            while (stackTrace.length > 0 && stackTrace[0].match(/at ([^\\/]+ )?\(?(.+)[\\/](.+?):(\d+):(\d+)\)?/) === null) {
                stackTrace.shift();
            }
            if (stackTrace.length > 0) {
                const stackDetailsCatchLine = stackTrace[0].match(/at ([^\\/]+ )?\(?(.+)[\\/](.+?):(\d+):(\d+)\)?/);
                [, functionName, pathToFile, filename, lineNumber, columnNumber] = stackDetailsCatchLine;
            } else {
                const mesg = `Logger error: Unable to get the filename and linenumber from the following stack: \n${arg.stack}.`;
                lgccyclicdependency(mesg);
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
            lgccyclicdependency(mesg);
            process.exit(1);
        }
        while (stackTrace.length > 0 && stackTrace[0].match(/at getCallerDetails(.*)/) !== null) {
            stackTrace.shift();
        }
        if (stackTrace.length > 0) {
            const stackDetailsCatchLine = stackTrace[0].match(/at ([^\\/]+ )?\(?(.+)[\\/](.+?):(\d+):(\d+)\)?/);
            if (stackDetailsCatchLine) {
                [, functionName, pathToFile, filename, lineNumber, columnNumber] = stackDetailsCatchLine;
                if (stackTrace[1] !== undefined) {
                    const stackDetailsErrorLineInTry = stackTrace[1].match(/at ([^\\/]+ )?\(?(.+)[\\/](.+?):(\d+):(\d+)\)?/);
                    if (stackDetailsErrorLineInTry) {
                        const [, , pathToFile2ndLine, filename2ndLine, lineNumber2ndLine] = stackDetailsErrorLineInTry;
                        if (pathToFile === pathToFile2ndLine && filename === filename2ndLine) {
                            lineNumber += `,${lineNumber2ndLine}`;
                        }
                    }
                }
            } else {
                const mesg = `Logger error: Unable to get the filename and linenumber from the following line: \n${stackTrace[0]}.`;
                lgccyclicdependency(mesg);
                filename = mesg;
            }
        } else {
            const mesg = `Logger error: Every line in stacktrace is from getCallerDetails().`;
            lgccyclicdependency(mesg);
            filename = mesg;
        }
    }
    functionName = functionName !== undefined ? functionName : '';
    pathToFile = pathToFile !== undefined ? pathToFile : '';
    filename = filename !== undefined ? filename : '';
    lineNumber = lineNumber !== undefined ? lineNumber : '';
    columnNumber = columnNumber !== undefined ? columnNumber : '';
    return {
        functionName: functionName,
        pathToFile: pathToFile,
        filename: filename,
        lineNumber: lineNumber,
        columnNumber: columnNumber,
    };
};

const getCallerDetails = (...args) => {
    const callerDetails = getCallerDetailsList(...args);
    return callerDetails.shift();
};

// eslint-disable-next-line import/prefer-default-export
export { getCallerDetails };
