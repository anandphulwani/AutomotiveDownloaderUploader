import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx-js-style';
import readline from 'readline';
import { addDays, startOfMonth, endOfMonth, format as formatDateDateFNS, parse as parseDateDateFNS } from 'date-fns';

/* eslint-disable import/extensions */
import { config } from './configs/config.js';
import { readDealerConfigurationFormatted } from './functions/excel.js';
import { formatDate, getCurrentDate, getLastMonthDate } from './functions/datetime.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import {
    addAdditionalImagesColumnAlternatively,
    styleOfDateHeading,
    centerAlign,
    normalFont,
    styleOfDealerTotal,
    styleOfGrandTotal,
    styleOfFTPDealerNameHeading,
    styleOfDailyInventoryHeading,
    styleOfDealerNameHeadingEven,
    styleOfDealerNameHeadingOdd,
    styleOfAdditionalImagesDataEven,
    styleOfAdditionalImagesDataOdd,
    styleOfGrandTotalOnBottomRight,
    styleOfTotalInventory,
    styleOfFTPOrAdditionalImagesTotal,
    styleOfDifference,
    styleOfAdditionalImagesTotalHeading,
} from './functions/reportsupportive.js';
import { makeDir } from './functions/filesystem.js';
import { lge, lgi, lgw } from './functions/loggersupportive.js';
// import {
//     allTrimStringArrayOfObjects,
//     trimMultipleSpacesInMiddleIntoOneArrayOfObjects,
//     trimSingleSpaceInMiddleArrayOfObjects,
//     trimSingleSpaceInMiddleArray,
// } from './stringformatting.js';
/* eslint-enable import/extensions */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let year;
let month;

async function getPeriod() {
    return new Promise((resolve) => {
        rl.question('Do you want to generate a report for the "Current (C)" or "Older (O)" period? (C/O): ', (answer) => {
            if (answer.toUpperCase() === 'C') {
                ({ year, month } = getCurrentDate());
                rl.close();
                resolve();
            } else if (answer.toUpperCase() === 'O') {
                const defaultDate = getLastMonthDate();
                rl.question(`Enter the year [${defaultDate.year}]: `, (yearInput) => {
                    if (/^\d{4}$/.test(yearInput)) {
                        year = yearInput || defaultDate.year;
                        rl.question(`Enter the month [${defaultDate.month}]: `, (monthInput) => {
                            if (/^(0?[1-9]|1[0-2])$/.test(monthInput)) {
                                month = monthInput || defaultDate.month;
                                rl.close();
                                resolve();
                            } else {
                                lge('Invalid month. Please enter a valid month (1-12).');
                                process.exit(1);
                            }
                        });
                    } else {
                        lge('Invalid year. Please enter a valid 4-digit year.');
                        process.exit(1);
                    }
                });
            } else {
                lge('Invalid input. Please enter either "C" or "O" for current or older period respectively.');
                process.exit(1);
            }
        });
    });
}
await getPeriod();
lgi(`Generating report for the current period: Year ${year}, Month ${month}`);

const startDate = startOfMonth(new Date(year, month - 1));
const endDate = endOfMonth(new Date(year, month - 1));

const dates = [];
let loopIndexDate = startDate;
while (loopIndexDate <= endDate) {
    dates.push(formatDateDateFNS(loopIndexDate, 'dd-MMM-yyyy'));
    loopIndexDate = addDays(loopIndexDate, 1);
}

const monthInMMM = formatDateDateFNS(parseDateDateFNS(month, 'MM', new Date()), 'MMM');
const reportGenerationPath = `${config.reportsPath}\\generated\\${year}-${month} (${formatDateDateFNS(new Date(), 'yyyy-MM-dd_HHmmss_SSS')})`;
const allUsernamesFromConfig = config.credentials.map((item) => item.username);

const missingDates = [];
for (let i = 0; i < dates.length; i++) {
    const rowsDate = dates[i];
    const formattedDate = formatDate(rowsDate, 'DD-MMM-YYYY__YYYY-MM-DD');
    const reportJSONFilePath = path.join(config.reportsPath, 'jsondata', `${year}-${month}`, `${formattedDate}_report.json`);
    if (!fs.existsSync(reportJSONFilePath)) {
        const dateWithDayOfWeek = formatDate(rowsDate, 'DD-MMM-YYYY__DD(EEE)');
        missingDates.push(dateWithDayOfWeek);
    }
}

if (missingDates.length > 0) {
    let missingDatesString = `Missing dates for which data is not available:\n\r  `;
    // eslint-disable-next-line no-restricted-syntax
    for (const missingDate of missingDates) {
        missingDatesString += missingDate;
        missingDatesString += ` ${' '.repeat(11 - missingDate.length > 0 ? 11 - missingDate.length : 0)}`;
    }
    lgw(`${missingDatesString}\r\n`);
}

const typesOfExcel = ['individual', 'merged'];
// for (let isIndividualOrMerged = 'individual'; isIndividualOrMerged !== false; ) {
// eslint-disable-next-line no-restricted-syntax
for (const typeOfExcel of typesOfExcel) {
    // eslint-disable-next-line no-restricted-syntax
    for (let username of allUsernamesFromConfig) {
        username = username.includes('@') ? username.split('@')[0] : username;

        const excelFilename = `${reportGenerationPath}\\${username} (${typeOfExcel})_${monthInMMM}_${year}.xlsx`;
        if (!fs.existsSync(path.dirname(excelFilename))) {
            makeDir(path.dirname(excelFilename));
        }
        const dealerConfiguration = readDealerConfigurationFormatted(username);
        const dealerNumbers = dealerConfiguration.map((item) => [item['Dealer Number'], item['Dealer Name']]);
        let dealersLength = dealerNumbers.length;
        const dealerConfigurationWithDates = [['', 'Date', ...dates], ...dealerNumbers];

        let lastRow = 0;
        let lastColumn = 0;
        let transposedData = [];
        for (let i = 0; i < dealerConfigurationWithDates[0].length; i++) {
            transposedData[i] = [];
            for (let j = 0; j < dealerConfigurationWithDates.length; j++) {
                transposedData[i][j] = dealerConfigurationWithDates[j][i];
            }
        }
        transposedData.unshift([]);

        for (let i = 0; i < transposedData.length; i++) {
            if (transposedData[i][0] === undefined || transposedData[i][0] === '' || transposedData[i][0] === 'Date') {
                // eslint-disable-next-line no-continue
                continue;
            }
            const rowsDate = transposedData[i][0];
            const formattedDate = formatDate(rowsDate, 'DD-MMM-YYYY__YYYY-MM-DD');
            const reportJSONFilePath = path.join(config.reportsPath, 'jsondata', `${year}-${month}`, `${formattedDate}_report.json`);
            if (!fs.existsSync(reportJSONFilePath)) {
                // eslint-disable-next-line no-continue
                continue;
            }
            const reportJSONContents = fs.readFileSync(reportJSONFilePath, 'utf8');
            let reportJSONObj = JSON.parse(reportJSONContents);
            reportJSONObj = Object.fromEntries(Object.entries(reportJSONObj).filter(([, value]) => value.username === username));

            for (let j = 1; j < transposedData[2].length; j++) {
                if (transposedData[2][j] === 'Additional Images') {
                    // eslint-disable-next-line no-continue
                    continue;
                }

                const folderBlocks = Object.fromEntries(
                    Object.entries(reportJSONObj).filter(
                        // eslint-disable-next-line no-loop-func
                        ([, value]) =>
                            value.folderName === transposedData[1][j] && typeof value.isFinished !== 'undefined' && value.isFinished === true
                    )
                );
                reportJSONObj = Object.fromEntries(
                    Object.entries(reportJSONObj).filter(
                        // eslint-disable-next-line no-loop-func
                        ([, value]) =>
                            !(value.folderName === transposedData[1][j] && typeof value.isFinished !== 'undefined' && value.isFinished === true)
                    )
                );

                let totalQty = 0;
                // eslint-disable-next-line no-restricted-syntax
                for (const key in folderBlocks) {
                    if (Object.prototype.hasOwnProperty.call(folderBlocks, key)) {
                        const item = folderBlocks[key];
                        totalQty += item.qty;
                    }
                }
                if (totalQty !== 0) {
                    transposedData[i][j] = totalQty;
                }
            }

            /* #region Display Allotment and Uploaded mismatch, where a folder was alloted but not uploaded, so has half the details. */
            /**
             *
             * Display Allotment and Uploaded mismatch, where a folder was alloted but not uploaded, so has half the details.
             *
             */
            if (Object.keys(reportJSONObj).length !== 0) {
                const allotmentAndUploadedMismatchJSONObj = Object.fromEntries(
                    Object.entries(reportJSONObj).filter(([, value]) => value.isFinished === false)
                );
                reportJSONObj = Object.fromEntries(Object.entries(reportJSONObj).filter(([, value]) => value.isFinished === true));

                if (Object.keys(allotmentAndUploadedMismatchJSONObj).length > 0) {
                    let allotmentAndUploadedMismatchString =
                        `Allotment and Uploaded folders mismatch, folder allotted but never received back for uploading,\r\n` +
                        `  unable to take it in into accounting: (${path.basename(reportJSONFilePath)})\r\n`;
                    allotmentAndUploadedMismatchString += `  `;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const key in allotmentAndUploadedMismatchJSONObj) {
                        if (Object.prototype.hasOwnProperty.call(allotmentAndUploadedMismatchJSONObj, key)) {
                            const allotedFolderName = allotmentAndUploadedMismatchJSONObj[key].allotmentFolderName;
                            const usernameWithAllotedFolderName = `${username}/${allotedFolderName}`;
                            allotmentAndUploadedMismatchString += usernameWithAllotedFolderName;
                            allotmentAndUploadedMismatchString += ` ${' '.repeat(
                                59 - usernameWithAllotedFolderName.length > 0 ? 59 - usernameWithAllotedFolderName.length : 0
                            )}`;
                        }
                    }
                    typeOfExcel === 'individual' ? lgw(`${allotmentAndUploadedMismatchString}\r\n`) : null;
                }
            }
            /* #endregion */

            /* #region Remaining folders in JSON file, but not consumed by report. (Probably because of missing dealer number is config's excel) */
            /**
             *
             *
             * Remaining folders in JSON file, but not consumed by report. (Probably because of missing dealer number is config's excel)
             *
             *
             */
            if (Object.keys(reportJSONObj).length !== 0) {
                let remainingUnconsumedFoldersString =
                    `Folders remaining in JSON file but are not consumed by the report,\r\n` +
                    `  probably because of missing dealer number is config's excel: (${path.basename(reportJSONFilePath)})\r\n`;
                remainingUnconsumedFoldersString += `  `;
                // eslint-disable-next-line no-restricted-syntax
                for (const key in reportJSONObj) {
                    if (Object.prototype.hasOwnProperty.call(reportJSONObj, key)) {
                        const allotedFolderName = reportJSONObj[key].allotmentFolderName;
                        const usernameWithAllotedFolderName = `${username}/${allotedFolderName}`;
                        remainingUnconsumedFoldersString += usernameWithAllotedFolderName;
                        remainingUnconsumedFoldersString += ` ${' '.repeat(
                            59 - usernameWithAllotedFolderName.length > 0 ? 59 - usernameWithAllotedFolderName.length : 0
                        )}`;
                    }
                }
                typeOfExcel === 'individual' ? lgw(`${remainingUnconsumedFoldersString}\r\n`) : null;
            }
            /* #endregion */
        }

        if (typeOfExcel === 'merged') {
            const result = [];
            for (let row = 0; row < transposedData.length; row++) {
                result.push([]);
            }

            for (let col = 0; col < transposedData[2].length; col++) {
                const dealerNumber = transposedData[2][col];
                let isPreviouslyPresent = true;
                if (!result[2].includes(dealerNumber)) {
                    isPreviouslyPresent = false;
                    result[2].push(dealerNumber);
                }
                const index = result[2].indexOf(dealerNumber);

                for (let row = 1; row < transposedData.length; row++) {
                    if (row === 2) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    const value = transposedData[row][col]; // !== undefined ? transposedData[row][col] : null;
                    if (!isPreviouslyPresent) {
                        result[row].push(value);
                    } else {
                        if (value === undefined) {
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                        if (result[row][index] === undefined) {
                            result[row][index] = value;
                        } else {
                            // eslint-disable-next-line no-lonely-if
                            if (typeof value === 'number') {
                                result[row][index] += value;
                            } else {
                                result[row][index] += `, ${value}`;
                            }
                        }
                    }
                }
            }
            transposedData = result;
            dealersLength = [...new Set(transposedData[2])].length - 1;
        }

        if (username === 'vambackground') {
            // Call the function to add blank columns
            addAdditionalImagesColumnAlternatively(transposedData);
        }

        transposedData.push([], [], [], [], [], []);
        transposedData.push(
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '']
        );
        lastRow = transposedData.length;
        lastColumn = transposedData[2].length;

        const worksheet = xlsx.utils.json_to_sheet(transposedData, { skipHeader: true });
        worksheet['!rows'] = [];
        worksheet['!cols'] = [];

        /* #region Changed undefined cell to numeric, so we can do use those cells in formulas, so that it doesn't give #VALUE error */
        for (let row = 0; row < lastRow; row++) {
            for (let col = 0; col < lastColumn; col++) {
                const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
                if (worksheet[cellAddress] === undefined || worksheet[cellAddress].v === undefined) {
                    worksheet[cellAddress] = { t: 'n', v: '' };
                }
            }
        }
        /* #endregion */

        /* #region Adding FTP Columns to the right part of the sheet */
        /**
         *
         * Adding FTP Columns to the right part of the sheet
         *
         */
        if (username === 'cute996') {
            for (let j = 1; j <= 20; j++) {
                const cellAddressFTPShortHeading = xlsx.utils.encode_cell({ r: 1, c: lastColumn + j });
                xlsx.utils.sheet_add_json(worksheet, [{ text: 'FTP' }], { origin: cellAddressFTPShortHeading, skipHeader: true });

                const cellAddressNextRow = xlsx.utils.encode_cell({ r: 2, c: lastColumn + j });
                xlsx.utils.sheet_add_json(worksheet, [{ text: '' }], { origin: cellAddressNextRow, skipHeader: true });
                for (let i = 0; i < dates.length; i++) {
                    const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn + j });
                    xlsx.utils.sheet_add_json(worksheet, [{ text: '' }], { origin: cellAddress, skipHeader: true });
                }
            }
            lastRow += 0;
            lastColumn += 21;
        }
        /* #endregion */

        /* #region Adding 'Daily Inventory' column to the right hand side of the sheet */
        /**
         *
         * Adding 'Daily Inventory' heading and setting the column size to 20
         *
         */
        const cellAddressDailyInventoryHeading = xlsx.utils.encode_cell({ r: 2, c: lastColumn + 1 });
        xlsx.utils.sheet_add_json(worksheet, [{ text: 'Daily Inventory' }], { origin: cellAddressDailyInventoryHeading, skipHeader: true });

        /**
         *
         * Calculating 'Daily Inventory' Total below the 'Daily Inventory' heading.
         *
         */
        // eslint-disable-next-line no-unreachable-loop
        for (let i = 0; i < dates.length; i++) {
            const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn + 1 });
            xlsx.utils.sheet_add_json(worksheet, [{ text: '' }], { origin: cellAddress, skipHeader: true });

            let formulaString;
            if (username === 'vambackground') {
                const dealerColumns = [];
                for (let j = 1; j < lastColumn; j += 2) {
                    const dealerColumn = xlsx.utils.encode_cell({ r: i + 3, c: j });
                    dealerColumns.push(dealerColumn);
                }
                const dealerColumnString = dealerColumns.join(', ');
                formulaString = `SUM(${dealerColumnString})`;
            } else if (username === 'cute996') {
                const dealerColumnRangeFrom = xlsx.utils.encode_cell({ r: i + 3, c: 1 });
                const dealerColumnRangeTo = xlsx.utils.encode_cell({ r: i + 3, c: transposedData[2].length - 1 });

                const FTPColumnRangeFrom = xlsx.utils.encode_cell({ r: i + 3, c: transposedData[2].length + 1 });
                const FTPColumnRangeTo = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn - 1 });
                formulaString = `SUM(${dealerColumnRangeFrom}:${dealerColumnRangeTo}) + SUM(${FTPColumnRangeFrom}:${FTPColumnRangeTo})`;
            } else {
                const dealerColumnRangeFrom = xlsx.utils.encode_cell({ r: i + 3, c: 1 });
                const dealerColumnRangeTo = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn - 1 });
                formulaString = `SUM(${dealerColumnRangeFrom}:${dealerColumnRangeTo})`;
            }
            xlsx.utils.sheet_set_array_formula(worksheet, cellAddress, formulaString);
        }
        /* #endregion */

        /* #region Adding 'Total Additional Images' column to the right hand side of the sheet */
        /**
         *
         * Adding 'Total Additional Images' heading and setting the column size to 20
         *
         */
        if (username === 'vambackground') {
            const cellAddressTotalAdditionalImagesHeading = xlsx.utils.encode_cell({ r: 2, c: lastColumn + 2 });
            xlsx.utils.sheet_add_json(worksheet, [{ text: 'Total Additional Images' }], {
                origin: cellAddressTotalAdditionalImagesHeading,
                skipHeader: true,
            });

            /**
             *
             * Calculating 'Total Additional Images' Total below the 'Total Additional Images' heading.
             *
             */
            // eslint-disable-next-line no-unreachable-loop
            for (let i = 0; i < dates.length; i++) {
                const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn + 2 });
                xlsx.utils.sheet_add_json(worksheet, [{ text: '' }], { origin: cellAddress, skipHeader: true });

                const dealerColumns = [];
                for (let j = 2; j < lastColumn; j += 2) {
                    const dealerColumn = xlsx.utils.encode_cell({ r: i + 3, c: j });
                    dealerColumns.push(dealerColumn);
                }
                const dealerColumnString = dealerColumns.join(', ');
                const formulaString = `SUM(${dealerColumnString})`;
                xlsx.utils.sheet_set_array_formula(worksheet, cellAddress, formulaString);
                worksheet[cellAddress].z = '#';
            }
        }
        /* #endregion */

        /**
         *
         */

        /* #region 'Dealer Total' Row (bottom of the table, just after dates data complete) to background blue and other formatting */
        /**
         *
         *
         * 'Dealer Total' Row (bottom of the table, just after dates data complete) to background blue and other formatting
         *
         *
         */
        const subTotalInDateColumnBlankCellAddress = xlsx.utils.encode_cell({ r: lastRow - 7, c: 0 });
        worksheet[subTotalInDateColumnBlankCellAddress] = { t: 's', v: '' };

        const cellAddressOfDealerTotalInDateColumn = xlsx.utils.encode_cell({ r: lastRow - 7, c: 0 });
        for (let j = 1; j < lastColumn + 3; j++) {
            const cellAddress = xlsx.utils.encode_cell({ r: lastRow - 7, c: j });
            // Skipping columns which is a blank buffer between 'Dealer Data' and 'FTP' and 'Daily Inventory' column
            if (j === transposedData[2].length || j === lastColumn) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const rangefrom = xlsx.utils.encode_cell({ r: 3, c: j });
            const rangeto = xlsx.utils.encode_cell({ r: lastRow - 11, c: j });
            xlsx.utils.sheet_set_array_formula(worksheet, cellAddress, `SUM(${rangefrom}:${rangeto})`);
            if (j === lastColumn + 2) {
                worksheet[cellAddress].z = '#';
            }
        }
        /* #endregion */

        /* #region 'Total Inventory' Text and Total (bottom of the table) */
        /**
         *
         * 'Total Inventory' Text and Total (bottom of the table)
         *
         */
        // Add 'Total Inventory' text
        const totalInventoryTextCellAddress = xlsx.utils.encode_cell({ r: lastRow - 5, c: 3 });
        worksheet[totalInventoryTextCellAddress] = { t: 's', v: 'Total Inventory' };

        // Add 'Total Inventory' formula
        const totalInventoryFormulaCellAddress = xlsx.utils.encode_cell({ r: lastRow - 5, c: 5 });
        if (username === 'vambackground') {
            // eslint-disable-next-line no-unreachable-loop
            const dealerTotalColumns = [];
            for (let j = 1; j < transposedData[2].length; j += 2) {
                const dealerTotalColumn = xlsx.utils.encode_cell({ r: lastRow - 7, c: j });
                dealerTotalColumns.push(dealerTotalColumn);
            }
            const dealerColumnString = dealerTotalColumns.join(', ');
            xlsx.utils.sheet_set_array_formula(worksheet, totalInventoryFormulaCellAddress, `SUM(${dealerColumnString})`);
        } else {
            const subTotalRangeFrom = xlsx.utils.encode_cell({ r: lastRow - 7, c: 1 });
            const subTotalRangeTo = xlsx.utils.encode_cell({ r: lastRow - 7, c: transposedData[2].length - 1 });
            xlsx.utils.sheet_set_array_formula(worksheet, totalInventoryFormulaCellAddress, `SUM(${subTotalRangeFrom}:${subTotalRangeTo})`);
        }
        /* #endregion */

        /* #region 'FTP' or 'Additional Images' Text and Total (bottom of the table) */
        /**
         *
         * 'FTP' or 'Additional Images' Text and Total (bottom of the table)
         *
         */
        const FTPTotalOrAdditionalImagesTextCellAddress = xlsx.utils.encode_cell({ r: lastRow - 3, c: 3 });
        const FTPTotalOrAdditionalImagesFormulaCellAddress = xlsx.utils.encode_cell({ r: lastRow - 3, c: 5 });
        if (username === 'cute996') {
            // Add 'FTP Total' text
            worksheet[FTPTotalOrAdditionalImagesTextCellAddress] = { t: 's', v: 'FTP Total' };

            const FTPColumnTotalRangeFrom = xlsx.utils.encode_cell({ r: lastRow - 7, c: transposedData[2].length + 1 });
            const FTPColumnTotalRangeTo = xlsx.utils.encode_cell({ r: lastRow - 7, c: lastColumn - 1 });
            xlsx.utils.sheet_set_array_formula(
                worksheet,
                FTPTotalOrAdditionalImagesFormulaCellAddress,
                `SUM(${FTPColumnTotalRangeFrom}:${FTPColumnTotalRangeTo})`
            );
        } else if (username === 'vambackground') {
            // Add 'Total Additional Images' text
            worksheet[FTPTotalOrAdditionalImagesTextCellAddress] = { t: 's', v: 'Additional Images' };

            // eslint-disable-next-line no-unreachable-loop
            const dealerAdditionalImagesTotalColumns = [];
            for (let j = 2; j < transposedData[2].length; j += 2) {
                const dealerAdditionalImagesTotalColumn = xlsx.utils.encode_cell({ r: lastRow - 7, c: j });
                dealerAdditionalImagesTotalColumns.push(dealerAdditionalImagesTotalColumn);
            }
            const dealerAdditionalImagesTotalString = dealerAdditionalImagesTotalColumns.join(', ');
            xlsx.utils.sheet_set_array_formula(worksheet, FTPTotalOrAdditionalImagesFormulaCellAddress, `SUM(${dealerAdditionalImagesTotalString})`);
        } else {
            xlsx.utils.sheet_add_json(worksheet, [{ text: '' }], { origin: FTPTotalOrAdditionalImagesFormulaCellAddress, skipHeader: true });
        }
        /* #endregion */

        /* #region 'Grand Total' Text and Total (bottom of the table) */
        /**
         *
         * 'Grand Total' Text and Total (bottom of the table)
         *
         */
        // Add 'Grand Total' text
        const grandTotalTextCellAddress = xlsx.utils.encode_cell({ r: lastRow - 1, c: 3 });
        // Add 'Grand Total' formula,
        const grandTotalFormulaCellAddress = xlsx.utils.encode_cell({ r: lastRow - 1, c: 5 });

        if (username === 'cute996') {
            worksheet[grandTotalTextCellAddress] = { t: 's', v: 'Grand Total' };
            xlsx.utils.sheet_set_array_formula(
                worksheet,
                grandTotalFormulaCellAddress,
                `${totalInventoryFormulaCellAddress}+${FTPTotalOrAdditionalImagesFormulaCellAddress}`
            );
        }
        /* #endregion */

        /* #region 'Difference' Text and Formula (adjacent to 'Total Inventory') */
        /**
         *
         * 'Difference' Text and Formula (adjacent to 'Total Inventory')
         *
         */

        // Add 'Difference' text to display, using formula, if difference cell has value; Also adding 'Difference' formula to display if exists
        const differenceTextUsingFormulaCellAddress = xlsx.utils.encode_cell({ r: lastRow - 5, c: 7 });
        const differenceFormulaCellAddress = xlsx.utils.encode_cell({ r: lastRow - 5, c: 8 });
        xlsx.utils.sheet_set_array_formula(
            worksheet,
            differenceTextUsingFormulaCellAddress,
            `=IF(${differenceFormulaCellAddress}<>"","Difference:","")`
        );

        const grandTotalOnBottomRightCellAddress = xlsx.utils.encode_cell({ r: lastRow - 7, c: lastColumn + 1 });
        if (username === 'vambackground') {
            const totalAdditionalImagesTotalCellAddress = xlsx.utils.encode_cell({ r: lastRow - 7, c: lastColumn + 2 });
            xlsx.utils.sheet_set_array_formula(
                worksheet,
                differenceFormulaCellAddress,
                `=IF(OR(${totalInventoryFormulaCellAddress}<>${grandTotalOnBottomRightCellAddress},` +
                    `${FTPTotalOrAdditionalImagesFormulaCellAddress}<>${totalAdditionalImagesTotalCellAddress}),` +
                    `ABS(${totalInventoryFormulaCellAddress}-${grandTotalOnBottomRightCellAddress}) &` +
                    ` ", " &` +
                    ` ABS(${FTPTotalOrAdditionalImagesFormulaCellAddress}-${totalAdditionalImagesTotalCellAddress}),` +
                    `"")`
            );
        } else if (username === 'cute996') {
            xlsx.utils.sheet_set_array_formula(
                worksheet,
                differenceFormulaCellAddress,
                `=IF(${grandTotalFormulaCellAddress}<>${grandTotalOnBottomRightCellAddress},
                ABS(${grandTotalFormulaCellAddress}-${grandTotalOnBottomRightCellAddress}),"")`
            );
        } else {
            xlsx.utils.sheet_set_array_formula(
                worksheet,
                differenceFormulaCellAddress,
                `=IF(${totalInventoryFormulaCellAddress}<>${grandTotalOnBottomRightCellAddress},
                ABS(${totalInventoryFormulaCellAddress}-${grandTotalOnBottomRightCellAddress}),"")`
            );
        }
        /* #endregion */

        /**
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         *
         */

        /* #region Style `Dealer Name` columns width to 20, `Additional Images` column width to 11, Style of 'Dealer Number' row to center align */
        /**
         *
         * Style `Dealer Name` columns width to 20, `Additional Images` column width to 11
         * Style of 'Dealer Number' row to center align
         *
         */
        // Adding 1 in the comparison as 1st column is of date
        for (let j = 0; j < 1 + (username === 'vambackground' ? dealersLength * 2 : dealersLength); j++) {
            const cellAddress = xlsx.utils.encode_cell({ r: 1, c: j });
            worksheet[cellAddress].s = centerAlign;
            if (username === 'vambackground') {
                if (j === 0 || j % 2 !== 0) {
                    worksheet['!cols'][j] = { wch: 20, font: { name: 'Arial', sz: 12 } };
                } else {
                    worksheet['!cols'][j] = { wch: 11, font: { name: 'Arial', sz: 12 } };
                }
            } else {
                worksheet['!cols'][j] = { wch: 20, font: { name: 'Arial', sz: 12 } };
            }
        }
        /* #endregion */

        /* #region Style, increased height of `Dealer Name` row to 65 */
        /**
         *
         * Style, increased height of `Dealer Name` row to 65
         *
         */
        worksheet['!rows'][2] = { hpt: 65 };
        /* #endregion */

        /* #region Style FTP Columns to the right part of the sheet */
        if (username === 'cute996') {
            /**
             *
             * Style  FTP Columns to the right part of the sheet
             *
             */
            for (let j = 0; j < 20; j++) {
                // Adding dealersLength + 2, one column for the first column (Date) and another column for the buffer between dealers data and FTP
                const cellAddressFTPShortHeading = xlsx.utils.encode_cell({ r: 1, c: dealersLength + 2 + j });
                worksheet[cellAddressFTPShortHeading].s = centerAlign;
                worksheet['!cols'][dealersLength + 2 + j] = { wch: 20 };

                const cellAddressNextRow = xlsx.utils.encode_cell({ r: 2, c: dealersLength + 2 + j });

                worksheet[cellAddressNextRow].s = styleOfFTPDealerNameHeading;
                for (let i = 0; i < dates.length; i++) {
                    const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: dealersLength + 2 + j });
                    worksheet[cellAddress].s = normalFont;
                }
            }
        }
        /* #endregion */

        /* #region Style 'Daily Inventory' column to the right hand side of the sheet */
        /**
         *
         * Style 'Daily Inventory' heading and setting the column size to 20
         *
         */
        worksheet[cellAddressDailyInventoryHeading].s = styleOfDailyInventoryHeading;
        worksheet['!cols'][lastColumn + 1] = { wch: 20 };

        /**
         *
         * Style 'Daily Inventory' Total below the 'Daily Inventory' heading.
         *
         */
        // eslint-disable-next-line no-unreachable-loop
        for (let i = 0; i < dates.length; i++) {
            const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn + 1 });
            worksheet[cellAddress].s = centerAlign;
        }
        /* #endregion */

        /* #region Style 'Total Additional Images' column to the right hand side of the sheet */
        if (username === 'vambackground') {
            /**
             *
             * Style 'Total Additional Images' heading and setting the column size to 20
             *
             */
            const cellAddressTotalAdditionalImagesHeading = xlsx.utils.encode_cell({ r: 2, c: lastColumn + 2 });
            worksheet[cellAddressTotalAdditionalImagesHeading].s = styleOfAdditionalImagesTotalHeading;
            worksheet['!cols'][lastColumn + 2] = { wch: 20 };

            /**
             *
             * Style 'Total Additional Images' Total below the 'Total Additional Images' heading.
             *
             */
            // eslint-disable-next-line no-unreachable-loop
            for (let i = 0; i < dates.length; i++) {
                const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: lastColumn + 2 });
                worksheet[cellAddress].s = centerAlign;
            }
        }
        /* #endregion */

        /* #region Style 'Date' Heading and Data below, Style "Dealer name", "Additional Images" Heading and Data below */
        /**
         *
         * Style 'Date' Heading and Data below
         * Style "Dealer name", "Additional Images" Heading and Data below
         *
         */
        for (let i = 2; i < lastRow - 10; i++) {
            for (let j = 0; j < transposedData[2].length - 1; j++) {
                const cellAddress = xlsx.utils.encode_cell({ r: i, c: j });
                const cellAddressAdditionalImages = xlsx.utils.encode_cell({ r: i, c: j + 1 });
                if (i === 2 && j === 0) {
                    // Style "Date" Heading cell
                    worksheet[cellAddress].s = styleOfDateHeading;
                } else if (j === 0) {
                    // Style "Date" column's data
                    worksheet[cellAddress].s = centerAlign;
                } else if (username === 'vambackground') {
                    if (i === 2) {
                        // Style "Dealer name", "Additional Images" Heading row
                        if ((j + 1) % 4 === 0) {
                            // Style "Dealer name", "Additional Images" Heading row, alternative colors 01
                            worksheet[cellAddress].s = styleOfDealerNameHeadingOdd;
                            worksheet[cellAddressAdditionalImages].s = styleOfDealerNameHeadingOdd;
                        } else {
                            // Style "Dealer name", "Additional Images" Heading row, alternative colors 02
                            worksheet[cellAddress].s = styleOfDealerNameHeadingEven;
                            worksheet[cellAddressAdditionalImages].s = styleOfDealerNameHeadingEven;
                        }
                    } else {
                        // Style data under the "Dealer name", "Additional Images" heading
                        // eslint-disable-next-line no-lonely-if
                        if ((j + 1) % 4 === 0) {
                            // Style data under the "Dealer name" to a normal font, "Additional Images" alternative colors 01 (lighter version)
                            worksheet[cellAddress].s = normalFont;
                            worksheet[cellAddressAdditionalImages].s = styleOfAdditionalImagesDataOdd;
                            worksheet[cellAddressAdditionalImages].z = '#';
                        } else {
                            // Style data under the "Dealer name" to a normal font, "Additional Images" alternative colors 02 (lighter version)
                            worksheet[cellAddress].s = normalFont;
                            worksheet[cellAddressAdditionalImages].s = styleOfAdditionalImagesDataEven;
                            worksheet[cellAddressAdditionalImages].z = '#';
                        }
                    }
                    j++;
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (i === 2) {
                        worksheet[cellAddress].s = styleOfDealerNameHeadingOdd;
                        worksheet[cellAddressAdditionalImages].s = styleOfDealerNameHeadingOdd;
                    } else {
                        // console.log(worksheet[cellAddress].v);
                        worksheet[cellAddress].s = normalFont;
                        worksheet[cellAddressAdditionalImages].s = normalFont;
                    }
                }
            }
        }
        /* #endregion */

        /**
         *
         */

        /* #region Style 'Dealer Total' Row (bottom of the table, just after dates data complete) to background blue and other formatting */
        /**
         *
         *
         * Style 'Dealer Total' Row (bottom of the table, just after dates data complete) to background blue and other formatting
         *
         *
         */
        worksheet[cellAddressOfDealerTotalInDateColumn].s = styleOfDealerTotal;
        for (let j = 1; j < lastColumn + 3; j++) {
            const cellAddress = xlsx.utils.encode_cell({ r: lastRow - 7, c: j });
            // Skipping columns which is a blank buffer between 'Dealer Data' and 'FTP' and 'Daily Inventory' column
            if (j === transposedData[2].length || j === lastColumn) {
                // eslint-disable-next-line no-continue
                continue;
            }

            if (j < lastColumn) {
                if (username === 'vambackground') {
                    // Style data under the "Additional Images" heading
                    if (j % 4 === 0) {
                        // Style data under the "Additional Images" alternative colors 01 (lighter version)
                        worksheet[cellAddress].s = styleOfAdditionalImagesDataOdd;
                    } else if (j % 2 === 0) {
                        // Style data under the "Additional Images" alternative colors 02 (lighter version)
                        worksheet[cellAddress].s = styleOfAdditionalImagesDataEven;
                    } else {
                        worksheet[cellAddress].s = styleOfDealerTotal;
                    }
                } else {
                    worksheet[cellAddress].s = styleOfDealerTotal;
                }
            } else if (j === lastColumn + 1) {
                worksheet[cellAddress].s = styleOfGrandTotalOnBottomRight;
            } else if (j === lastColumn + 2) {
                // eslint-disable-next-line no-lonely-if
                if (username === 'vambackground') {
                    worksheet[cellAddress].s = styleOfAdditionalImagesTotalHeading;
                }
            }
        }
        /* #endregion */

        /* #region Style 'Total Inventory' Text and Total (bottom of the table) */
        /**
         *
         * Style 'Total Inventory' Text and Total (bottom of the table)
         *
         */
        worksheet[totalInventoryTextCellAddress].s = styleOfTotalInventory;
        worksheet[totalInventoryFormulaCellAddress].s = styleOfTotalInventory;
        /* #endregion */

        /* #region Style 'FTP' or 'Additional Images' Text and Total (bottom of the table) */
        /**
         *
         * Style 'FTP' or 'Additional Images' Text and Total (bottom of the table)
         *
         */
        if (username === 'cute996' || username === 'vambackground') {
            worksheet[FTPTotalOrAdditionalImagesTextCellAddress].s = styleOfFTPOrAdditionalImagesTotal;
            worksheet[FTPTotalOrAdditionalImagesFormulaCellAddress].s = styleOfFTPOrAdditionalImagesTotal;
            worksheet[FTPTotalOrAdditionalImagesFormulaCellAddress].z = '#';
        }
        /* #endregion */

        /* #region Style 'Grand Total' Text and Total (bottom of the table) */
        /**
         *
         * Style 'Grand Total' Text and Total (bottom of the table)
         *
         *
         */
        if (username === 'cute996') {
            worksheet[grandTotalTextCellAddress].s = styleOfGrandTotal;
            worksheet[grandTotalFormulaCellAddress].s = styleOfGrandTotal;
            worksheet[grandTotalFormulaCellAddress].z = '#';
        }
        /* #endregion */

        /* #region Style 'Difference' Text and Formula (adjacent to 'Total Inventory') */
        /**
         *
         * Style 'Difference' Text and Formula (adjacent to 'Total Inventory')
         *
         */
        worksheet[differenceTextUsingFormulaCellAddress].s = styleOfDifference;
        worksheet[differenceFormulaCellAddress].s = styleOfDifference;
        worksheet[differenceFormulaCellAddress].z = '#';
        /* #endregion */

        /**
         *
         *
         *
         */

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        xlsx.writeFile(workbook, excelFilename, { sheetStubs: true });
    }
    // eslint-disable-next-line no-nested-ternary
    // isIndividualOrMerged = isIndividualOrMerged === 'individual' ? 'merged' : isIndividualOrMerged === 'merged' ? false : null;
}
