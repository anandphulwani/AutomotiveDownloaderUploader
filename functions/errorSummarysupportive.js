import readlineSync from 'readline-sync';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted, isValidDate } from './datetime.js';
/* eslint-enable import/extensions */

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

export { getLogLineRegex, askDate, askQuestionForFilterByExecutableType, createQuestionForFilterByExecutableType, askQuestionForHideByLogType };
