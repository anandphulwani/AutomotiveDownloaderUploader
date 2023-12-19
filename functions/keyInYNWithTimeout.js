import readline from 'readline';

/* eslint-disable import/extensions */
import { clearLastLinesOnConsole } from './consolesupportive.js';
/* eslint-enable import/extensions */

export default function keyInYNWithTimeout(question, timeout = 5000, defaultOption = false) {
    return new Promise((resolve) => {
        let timeoutId;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const askQuestion = (isWrongResponse) => {
            resetTimeout();
            rl.question(`${isWrongResponse ? 'Invalid input, ' : ''}${question} (Y/N):`, (answer) => {
                resetTimeout();
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

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('\r');
                process.stdout.moveCursor(0, -1);
                process.stdout.clearLine();
                console.log('Timed out.');
                rl.close();
                resolve({ answer: defaultOption, isDefaultOption: true }); // Resolve with the default option
            }, timeout);
        };

        askQuestion(false);
    });
}
