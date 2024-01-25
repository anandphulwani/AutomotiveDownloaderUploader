import fs from 'fs';
import path from 'path';
import cfonts from 'cfonts';

/* eslint-disable import/extensions */
import { getProjectLogsDirPath } from './functions/projectpaths.js';
import { formatDate } from './functions/datetime.js';
import { lge } from './functions/loggerandlocksupportive.js';
import { printSectionSeperator } from './functions/others.js';
import { clearLastLinesOnConsole } from './functions/consolesupportive.js';
import { levelToChalkColor } from './functions/loggerlogformats.js';
import { getRowPosOnTerminal } from './functions/terminal.js';
import syncOperationWithErrorHandling from './functions/syncOperationWithErrorHandling.js';
import commonInit from './functions/commonInit.js';
import {
    askDate,
    askQuestionForFilterByExecutableType,
    askQuestionForHideByLogType,
    createQuestionForFilterByExecutableType,
    getLogLineRegex,
} from './functions/errorSummarysupportive.js';
/* eslint-enable import/extensions */

const headingOptions = {
    font: 'block', // font to use for the output
    align: 'center', // alignment of the output
    colors: ['#D3D3D3', '#FFFFFF'], // colors of the output (gradient)
    background: 'black', // background color of the output
    letterSpacing: 1, // letter spacing of the output
    lineHeight: 1, // line height of the output
    space: true, // add space between letters
    maxLength: '0', // maximum length of the output (0 = unlimited)
};

await commonInit('errorSummary.js');

let beforeQuestionPos = await getRowPosOnTerminal();

const validDate = askDate('Enter a date (YYYY-MM-DD) or press Enter for today: ');

const dirPath = path.join(getProjectLogsDirPath(), validDate);
if (!syncOperationWithErrorHandling(fs.existsSync, dirPath)) {
    lge(`Error: Logs for '${validDate}' to generate error summary does not exist.`);
    process.exit(0);
}

let afterQuestionPos = await getRowPosOnTerminal();
clearLastLinesOnConsole(afterQuestionPos - beforeQuestionPos);

let files = syncOperationWithErrorHandling(fs.readdirSync, dirPath).filter((file) => file.endsWith('_usererrors.log'));
const execNames = files
    .map((file) => {
        const match = file.match(/-(.+?)\(/);
        return match ? match[1] : null;
    })
    .filter(Boolean);
const uniqueExecNames = [...new Set(execNames)];

beforeQuestionPos = await getRowPosOnTerminal();
const [questionForFilterByExecutableType, itemsToKeyObj] = createQuestionForFilterByExecutableType(uniqueExecNames);
const filterByExecutableType = askQuestionForFilterByExecutableType(questionForFilterByExecutableType, itemsToKeyObj);
afterQuestionPos = await getRowPosOnTerminal();
clearLastLinesOnConsole(afterQuestionPos - beforeQuestionPos);

if (!filterByExecutableType.includes('a')) {
    const filteredKeys = Object.keys(itemsToKeyObj).filter((key) => filterByExecutableType.includes(itemsToKeyObj[key].keyChar));
    const regexPattern = filteredKeys.map((key) => `-${key}\\(`).join('|');
    const regex = new RegExp(regexPattern);
    files = files.filter((file) => regex.test(file));
}

beforeQuestionPos = await getRowPosOnTerminal();
const filterByLogType = askQuestionForHideByLogType();
afterQuestionPos = await getRowPosOnTerminal();
clearLastLinesOnConsole(afterQuestionPos - beforeQuestionPos);

const individualLogs = [];
cfonts.say(formatDate(validDate, 'YYYY-MM-DD__DD MMM YYYY'), headingOptions);

// eslint-disable-next-line no-restricted-syntax
for (const file of files) {
    const fileContent = syncOperationWithErrorHandling(fs.readFileSync, path.join(dirPath, file), 'utf8');
    const logLineRegexExpression = new RegExp(getLogLineRegex(), 'g');
    let logLineBlockMatch = logLineRegexExpression.exec(fileContent);
    while (logLineBlockMatch !== null) {
        const dateTimeForSorting = logLineBlockMatch[1];
        const time = logLineBlockMatch[2];
        const uniqueId = logLineBlockMatch[3];
        const logType = logLineBlockMatch[4];
        const message = logLineBlockMatch[5];
        if (
            !(
                (filterByLogType.includes('h') && logType === 'HICCUP') ||
                (filterByLogType.includes('e') && logType === 'ERROR') ||
                (filterByLogType.includes('w') && logType === 'WARNING')
            )
        ) {
            individualLogs.push({
                dateTimeForSorting,
                time,
                uniqueId,
                logType,
                message,
            });
        }
        logLineBlockMatch = logLineRegexExpression.exec(fileContent);
    }
}

individualLogs.sort((a, b) => a.dateTimeForSorting.localeCompare(b.dateTimeForSorting));
// eslint-disable-next-line no-restricted-syntax
for (const individualLog of individualLogs) {
    printSectionSeperator('info', true);
    const level = individualLog.logType.toLowerCase();
    let firstLineLength = 0;

    let mesgToPrint = '';
    mesgToPrint += '[';
    mesgToPrint += `${levelToChalkColor[level][0](individualLog.time)}`;
    mesgToPrint += '] ';
    firstLineLength += 1 + individualLog.time.length + 2;

    mesgToPrint += '[';
    mesgToPrint += `${levelToChalkColor[level][0](individualLog.uniqueId)}`;
    mesgToPrint += '] ';
    firstLineLength += 1 + individualLog.uniqueId.length + 2;

    mesgToPrint += '[';
    mesgToPrint += `${levelToChalkColor[level][0](individualLog.logType)}`;
    mesgToPrint += '] ';
    firstLineLength += 1 + individualLog.logType.length + 2;

    mesgToPrint += individualLog.message
        .split('\n')
        .map((line, index) => {
            if (index === 0) {
                return line.padEnd(120 - firstLineLength, ' ');
            }
            return line.padEnd(120, ' ');
        })
        .join('\n');
    console.log(levelToChalkColor[level][1](mesgToPrint));
}
printSectionSeperator('info', true);
