import chalk from 'chalk';

function printSectionSeperator() {
    console.log(chalk.black.bgWhiteBright('-'.repeat(80)));
}

// TODO: Remove retryCount variable and relative functions, when debugging is complete
let retryCount = 0;
function incRetryCount() {
    retryCount++;
}

function getRetryCount() {
    return retryCount;
}

// eslint-disable-next-line import/prefer-default-export
export { printSectionSeperator, incRetryCount, getRetryCount };
