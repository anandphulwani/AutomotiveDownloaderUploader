import readline from 'readline';

/* eslint-disable import/extensions */
import { clearLastLinesOnConsole } from './consolesupportive.js';
import { printSectionSeperator } from './others.js';
/* eslint-enable import/extensions */

export default function keyInYNWithTimeout(question, timeout = 5000, defaultOption = false) {
    return new Promise((resolve) => {
        let timeoutId;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const askQuestion = (isWrongResponse) => {
            resetTimeout(isWrongResponse);
            rl.question(`${isWrongResponse ? 'Invalid input, ' : ''}${question} (Y/N):`, (answer) => {
                resetTimeout(isWrongResponse);
                const upperCaseAnswer = answer.toUpperCase();
                if (upperCaseAnswer === 'Y' || upperCaseAnswer === 'N') {
                    clearTimeout(timeoutId);
                    rl.close();
                    resolve({ answer: upperCaseAnswer === 'Y', isDefaultOption: false });
                } else {
                    clearLastLinesOnConsole(1);
                    askQuestion(true); // Ask again
                }
            });
        };

        const resetTimeout = (isWrongResponse) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const totalLengthOfString = question.length + 7 + (isWrongResponse ? 15 : 0);
                const noOfRows = Math.ceil(totalLengthOfString / 120);
                console.log('\r');
                clearLastLinesOnConsole(noOfRows);
                printSectionSeperator(undefined, true);
                console.log('Timed out.');
                printSectionSeperator(undefined, true);
                rl.close();
                resolve({ answer: defaultOption, isDefaultOption: true }); // Resolve with the default option
            }, timeout);
        };

        askQuestion(false);
    });
}
