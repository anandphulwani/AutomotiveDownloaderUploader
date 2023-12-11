import readline from 'readline';

/* eslint-disable import/extensions */
import { printSectionSeperator } from './others.js';
/* eslint-enable import/extensions */

export default function keyInYNWithTimeout(question, timeout = 5000, defaultOption = false) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const askQuestion = () => {
            rl.question(`${question} (Y/N) `, (answer) => {
                const upperCaseAnswer = answer.toUpperCase();
                if (upperCaseAnswer === 'Y' || upperCaseAnswer === 'N') {
                    rl.close();
                    clearTimeout(timeoutId);
                    resolve(upperCaseAnswer === 'Y');
                } else {
                    console.log('Invalid input. Please enter "Y" or "N".');
                    askQuestion(); // Ask again
                }
            });
        };

        const timeoutId = setTimeout(() => {
            rl.close();
            console.log('\r');
            printSectionSeperator();
            // console.log(`\nTimeout - Default option '${defaultOption ? 'Yes' : 'No'}' selected`);
            resolve(defaultOption); // Resolve with the default option
        }, timeout);

        askQuestion();
    });
}
