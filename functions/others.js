import chalk from 'chalk';

function printSectionSeperator() {
    console.log(chalk.black.bgWhiteBright('-'.repeat(80)));
}

// eslint-disable-next-line import/prefer-default-export
export { printSectionSeperator };
