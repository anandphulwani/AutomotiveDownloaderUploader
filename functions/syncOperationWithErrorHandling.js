import chalk from 'chalk';

/* eslint-disable import/extensions */
import { msleep } from './sleep.js';
/* eslint-enable import/extensions */

export default function syncOperationWithErrorHandling(func, ...args) {
    let errorObj;
    for (let index = 0; index < 240; index++) {
        if (index !== 0 && index % 20 === 0) {
            process.stdout.write(chalk.yellow(` ■`));
        }
        try {
            return func(...args);
        } catch (error) {
            errorObj = error;
            const resourceBusyOrLockedOrNotPermittedRegexString = '^(EBUSY: resource busy or locked|EPERM: operation not permitted)';
            const resourceBusyOrLockedOrNotPermittedRegexExpression = new RegExp(resourceBusyOrLockedOrNotPermittedRegexString);
            if (resourceBusyOrLockedOrNotPermittedRegexExpression.test(error.message)) {
                msleep(500);
            } else {
                throw error;
            }
        }
    }
    throw errorObj;
}
