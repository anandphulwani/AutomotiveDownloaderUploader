/* eslint-disable import/extensions */
import { lgccyclicdependency } from './loggercyclicdependency.js';
/* eslint-enable import/extensions */

function extractCallerDetailsFromStack(stack) {
    const callerDetailsList = [];
    const stackTrace = stack.split('\n');
    if (stackTrace[0].match(/^[a-zA-Z]*Error:/) || stackTrace[0] === 'Error') {
        stackTrace.shift();
    } else {
        const mesg = `Logger error: Unable to match the first line, it doesnt contain anything like 'Error: ' in the line: \n${stackTrace[0]}\nError Stack:\n${stack}`;
        lgccyclicdependency(mesg);
        process.exit(1);
    }
    while (stackTrace.length > 0) {
        const regexOfAtFilenameLineNumber = /at (?:([^\\/]+) )?\(?(.+)[\\/](.+?):(\d+):(\d+)\)?/;
        const regexOfNodeInternal = / \(node:internal/;
        const regexOfgetCallerDetails =
            /at (getCallerDetailsList |getCallerDetails |getCallerHierarchyFormatted |getCallerFormatted |getCallerHierarchyWithFunctionNameFormatted )(.*)/;
        const regexOfLoggerFunctions = /at (lg[\S][\S]? )(.*)/;
        if (
            stackTrace[0].match(regexOfAtFilenameLineNumber) === null ||
            stackTrace[0].match(regexOfgetCallerDetails) !== null ||
            stackTrace[0].match(regexOfNodeInternal) !== null ||
            stackTrace[0].match(regexOfLoggerFunctions) !== null
        ) {
            stackTrace.shift();
            // eslint-disable-next-line no-continue
            continue;
        }
        const stackDetailsCatchLine = stackTrace[0].match(regexOfAtFilenameLineNumber);
        callerDetailsList.push({
            functionName: stackDetailsCatchLine[1] !== undefined ? stackDetailsCatchLine[1] : '',
            pathToFile: stackDetailsCatchLine[2] !== undefined ? stackDetailsCatchLine[2] : '',
            filename: stackDetailsCatchLine[3] !== undefined ? stackDetailsCatchLine[3] : '',
            lineNumber: stackDetailsCatchLine[4] !== undefined ? stackDetailsCatchLine[4] : '',
            columnNumber: stackDetailsCatchLine[5] !== undefined ? stackDetailsCatchLine[5] : '',
        });
        stackTrace.shift();
    }
    return callerDetailsList;
}
const getCallerDetailsList = (...args) => {
    let callerDetailsList = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (arg instanceof Error) {
            callerDetailsList = extractCallerDetailsFromStack(arg.stack);
            if (callerDetailsList.length === 0) {
                const mesg = `Logger error: Unable to extract filename and linenumber from the following stack which was sent: \n${arg.stack}.`;
                lgccyclicdependency(mesg);
            }
            break;
        }
    }
    if (callerDetailsList.length === 0) {
        const { stack } = new Error();
        callerDetailsList = extractCallerDetailsFromStack(stack);
        if (callerDetailsList.length === 0) {
            const mesg = `Logger error: Unable to extract filename and linenumber from the following stack which was generated to detect caller details: \n${stack}.`;
            lgccyclicdependency(mesg);
        }
    }
    return callerDetailsList;
};

const getCallerFormatted = (...args) => {
    const callerDetailsList = getCallerDetailsList(...args);
    const callerDetails = callerDetailsList.shift();
    return `${callerDetails.filename}:${callerDetails.lineNumber}`;
};

const getCallerHierarchyFormatted = (...args) => {
    const callerDetailsList = getCallerDetailsList(...args);
    const groupedByFilename = callerDetailsList.reduce((acc, { filename, lineNumber }) => {
        acc[filename] = acc[filename] || [];
        acc[filename].push(lineNumber);
        return acc;
    }, {});

    const output = Object.entries(groupedByFilename)
        .map(([filename, lineNumbers]) => `${filename}:${lineNumbers.join(',')}`)
        .join('; ');
    return output;
};

const getCallerHierarchyWithFunctionNameFormatted = (...args) => {
    let callerDetailsList;
    if (Array.isArray(args[0])) {
        [callerDetailsList] = args;
    } else {
        callerDetailsList = getCallerDetailsList(...args);
    }
    return callerDetailsList.map((detail) => `{${detail.functionName}}${detail.filename}:${detail.lineNumber}`).join('; ');
};

const getCallerDetails = (...args) => {
    let callerDetailsList;
    if (Array.isArray(args[0])) {
        [callerDetailsList] = args;
    } else {
        callerDetailsList = getCallerDetailsList(...args);
    }
    return callerDetailsList.shift();
};

// eslint-disable-next-line import/prefer-default-export
export { getCallerDetails, getCallerDetailsList, getCallerFormatted, getCallerHierarchyFormatted, getCallerHierarchyWithFunctionNameFormatted };
