import readline from 'readline';
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
/* eslint-enable import/extensions */

let individualLogs = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askDate(question) {
    rl.question(question, (input) => {
        const dateInput = input.trim() || instanceRunDateFormatted;
        if (!isValidDate(dateInput)) {
            console.log('Invalid date format. Please use YYYY-MM-DD.');
            askDate(question);
        } else {
            checkDirectory(dateInput);
        }
    });
}

function checkDirectory(dateString) {
    const dirPath = path.join(getProjectLogsDirPath(), dateString);
    if (!fs.existsSync(dirPath)) {
        lge(`Error: Logs for '${dateString}' to generate error summary does not exist.`);
        rl.close();
    } else {
        clearLastLinesOnConsole(1);
        individualLogs = [];
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
        cfonts.say(formatDate(dateString, 'YYYY-MM-DD__DD MMM YYYY'), headingOptions);
        readLogFiles(dirPath);
    }
}

function readLogFiles(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
            if (file.endsWith('_usererrors.log')) {
                processLogFile(path.join(dirPath, file));
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err);
    } finally {
        rl.close();
    }
    sortAndPrintIndividualLogs();
}

askDate('Enter a date (YYYY-MM-DD) or press Enter for today: ');

function getLogLineRegex() {
    const startOfLine = '(\\d{4}-\\d{2}-\\d{2} (\\d{2}:\\d{2}):\\d{2}:\\d{3}) \\[\\s*(\\d*)\\] \\[\\s*([A-Z]+)\\s*\\] ';
    return `(?:${startOfLine}([\\s\\S]*?))(?=[\\s]*[\\r\\n|\\n]${startOfLine}|[\\s]*$)`;
}

function processLogFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return parseLogEntries(fileContent);
}

function parseLogEntries(fileContent) {
    const logLineRegexExpression = new RegExp(getLogLineRegex(), 'g');
    let logLineBlockMatch = logLineRegexExpression.exec(fileContent);
    while (logLineBlockMatch !== null) {
        const dateTimeForSorting = logLineBlockMatch[1];
        const time = logLineBlockMatch[2];
        const uniqueId = logLineBlockMatch[3];
        const logType = logLineBlockMatch[4];
        const message = logLineBlockMatch[5];
        individualLogs.push({
            dateTimeForSorting,
            time,
            uniqueId,
            logType,
            message,
        });
        logLineBlockMatch = logLineRegexExpression.exec(fileContent);
    }
}

function sortAndPrintIndividualLogs() {
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
}
