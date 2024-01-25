import readlineSync from 'readline-sync';
import fs from 'fs';
import path from 'path';
import cfonts from 'cfonts';

/* eslint-disable import/extensions */
import { getProjectLogsDirPath } from './functions/projectpaths.js';
import { formatDate, instanceRunDateFormatted, isValidDate } from './functions/datetime.js';
import { lge } from './functions/loggerandlocksupportive.js';
import { printSectionSeperator } from './functions/others.js';
import { clearLastLinesOnConsole } from './functions/consolesupportive.js';
import { levelToChalkColor } from './functions/loggerlogformats.js';
import { getRowPosOnTerminal } from './functions/terminal.js';
import syncOperationWithErrorHandling from './functions/syncOperationWithErrorHandling.js';
import { config } from './configs/config.js';
import commonInit from './functions/commonInit.js';

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

function getLogLineRegex() {
    const startOfLine = '(\\d{4}-\\d{2}-\\d{2} (\\d{2}:\\d{2}):\\d{2}:\\d{3}) \\[\\s*(\\d*)\\] \\[\\s*([A-Z]+)\\s*\\] ';
    return `(?:${startOfLine}([\\s\\S]*?))(?=[\\s]*[\\r\\n|\\n]${startOfLine}|[\\s]*$)`;
}

function isValidExecutableType(input, availableOptions) {
    let isValid = true;
    const inputChars = input.split('');
    // eslint-disable-next-line no-restricted-syntax
    for (const char of inputChars) {
        if (!availableOptions.includes(char)) {
            isValid = false;
        }
    }
    return isValid;
}

function askDate(question) {
    let dateInput;
    do {
        const input = readlineSync.question(question);
        dateInput = input.trim() || instanceRunDateFormatted;
        if (!isValidDate(dateInput)) {
            console.log('Invalid date format. Please use YYYY-MM-DD.');
        }
    } while (!isValidDate(dateInput));
    return dateInput;
}

function askQuestionForFilterByExecutableType(question, itemsToKeyObj) {
    const availableOptions = [...Object.values(itemsToKeyObj).map((obj) => obj.keyChar), 'a'];
    let filterByExecutableType;
    do {
        const input = readlineSync.question(question);
        filterByExecutableType = input.trim() || 'a';
        if (!isValidExecutableType(filterByExecutableType, availableOptions)) {
            console.log(`Invalid input, ${question}`);
        }
    } while (!isValidExecutableType(filterByExecutableType, availableOptions));
    return filterByExecutableType;
}

function createQuestionForFilterByExecutableType(items) {
    const itemsToKeyObj = {};
    itemsToKeyObj.all = {};
    itemsToKeyObj.all.keyChar = 'a';
    itemsToKeyObj.all.questionPart = '[a]ll';

    // eslint-disable-next-line no-restricted-syntax
    for (const item of items) {
        const usedKeys = Object.values(itemsToKeyObj).map((obj) => obj.keyChar);
        itemsToKeyObj[item] = {};
        let keyChar;
        // eslint-disable-next-line no-restricted-syntax
        for (const char of item) {
            if (!usedKeys.includes(char.toLowerCase())) {
                keyChar = char.toLowerCase();
                itemsToKeyObj[item].keyChar = keyChar;
                itemsToKeyObj[item].questionPart = item.replace(keyChar, `[${keyChar}]`);
                break;
            }
        }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const key in itemsToKeyObj) {
        if (Object.prototype.hasOwnProperty.call(itemsToKeyObj, key) && !itemsToKeyObj[key].keyChar) {
            const usedKeys = Object.values(itemsToKeyObj)
                .filter((obj) => obj.keyChar !== undefined)
                .map((obj) => obj.keyChar);
            let charCode = 97; // ASCII code for 'a'
            while (usedKeys.includes(String.fromCharCode(charCode))) {
                charCode++;
            }
            itemsToKeyObj[key].keyChar = String.fromCharCode(charCode);
            itemsToKeyObj[key].questionPart = `${key}[${itemsToKeyObj[key].keyChar}]`;
        }
    }

    const questionParts = Object.values(itemsToKeyObj)
        .filter((obj) => obj.keyChar !== 'a')
        .map((obj) => obj.questionPart);
    let question;
    if (questionParts.length > 1) {
        question = `Filter logs for ${questionParts.join(', ')} or do you want to see [a]ll items?:`;
    } else {
        question = `Do you want to see [a]ll items?:`;
    }
    return [question, itemsToKeyObj];
}

function askQuestionForHideByLogType() {
    const question = `Hide logs by log type [h]iccup, [e]rror, [w]arn or do you want to see [a]ll items?:`;
    const availableOptions = ['h', 'e', 'w', 'a'];
    let filterByLogType;
    do {
        const input = readlineSync.question(question);
        filterByLogType = input.trim() || 'a';
        if (!isValidExecutableType(filterByLogType, availableOptions)) {
            console.log(`Invalid input, ${question}`);
        }
    } while (!isValidExecutableType(filterByLogType, availableOptions));
    return filterByLogType;
}

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
