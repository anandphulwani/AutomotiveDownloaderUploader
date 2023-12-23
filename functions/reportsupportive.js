import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { attainLock, releaseLock, lgc, lge } from './loggerandlocksupportive.js';
import { config } from '../configs/config.js';
// import { createBackupOfFile } from './datastoresupportive.js';
import { instanceRunDateFormatted, instanceRunDateWODayFormatted } from './datetime.js';
import { makeDir } from './filesystem.js';
import { setCurrentDealerConfiguration, getDealerNameFromDC } from './excelsupportive.js';
/* eslint-enable import/extensions */

function addAllotmentToReport(allotmentDetails) {
    const reportDateFolder = path.join(config.reportsPath, 'jsondata', instanceRunDateWODayFormatted);
    makeDir(reportDateFolder);
    const reportJSONFilePath = path.join(reportDateFolder, `${instanceRunDateFormatted}_report.json`);
    try {
        if (!fs.existsSync(reportJSONFilePath)) {
            const jsonString = JSON.stringify({}, null, 3);
            fs.writeFileSync(reportJSONFilePath, jsonString);
        }
        // createBackupOfFile(fileToOperateOn, newConfigUserContent);
        attainLock(reportJSONFilePath, undefined, false);

        const reportJSONContents = fs.readFileSync(reportJSONFilePath, 'utf8');
        const reportJSONObj = JSON.parse(reportJSONContents);

        let currentUsernamesDealerConfiguration = null;
        // eslint-disable-next-line no-restricted-syntax
        for (const allotmentDetail of allotmentDetails) {
            const allotmentId = allotmentDetail[0];
            const usernameTrimmedAndFolderName = allotmentDetail[1];
            const username = path.dirname(usernameTrimmedAndFolderName);
            const folderName = path.basename(usernameTrimmedAndFolderName);

            if (currentUsernamesDealerConfiguration !== username) {
                setCurrentDealerConfiguration(username);
                currentUsernamesDealerConfiguration = username;
            }
            const dealerName = getDealerNameFromDC(folderName);

            const allottedTo = allotmentDetail[2];
            const qty = allotmentDetail[3];
            const allotmentFolderName = allotmentDetail[4];
            reportJSONObj[allotmentId] = {
                isAllotted: true,
                username: username,
                folderName: folderName,
                allotmentFolderName: allotmentFolderName,
                dealerName: dealerName,
                allottedTo: allottedTo,
                qty: qty,
                isFinished: false,
            };
        }
        const updatedReportJSONObj = JSON.stringify(reportJSONObj, null, 3);
        fs.writeFileSync(reportJSONFilePath, updatedReportJSONObj, 'utf8');
        releaseLock(reportJSONFilePath, undefined, false);
    } catch (err) {
        lgc(err);
        releaseLock(reportJSONFilePath, undefined, false);
        process.exit(1);
    }
}

function addUploadingToReport(uploadingDetail) {
    const reportJSONFilePath = path.join(config.reportsPath, 'jsondata', instanceRunDateWODayFormatted, `${instanceRunDateFormatted}_report.json`);
    try {
        if (!fs.existsSync(reportJSONFilePath)) {
            lge(`Todays report json file '${instanceRunDateFormatted}_report.json' was not created while allotment, Exiting.`);
            process.exit(1);
        }
        // createBackupOfFile(fileToOperateOn, newConfigUserContent);
        attainLock(reportJSONFilePath, undefined, false);

        const reportJSONContents = fs.readFileSync(reportJSONFilePath, 'utf8');
        const reportJSONObj = JSON.parse(reportJSONContents);

        const allotmentFolderName = uploadingDetail[0];
        const allotmentId = uploadingDetail[1];
        const cutter = uploadingDetail[2];
        const finisher = uploadingDetail[3];

        if (reportJSONObj[allotmentId]) {
            if (allotmentFolderName === reportJSONObj[allotmentId].allotmentFolderName) {
                reportJSONObj[allotmentId] = {
                    ...reportJSONObj[allotmentId],
                    ...{
                        isFinished: true,
                        cutter: cutter,
                        finisher: finisher,
                    },
                };
            } else {
                lge(
                    `The allotment folder name '${reportJSONObj[allotmentId].allotmentFolderName}' does not match folder name coming back for uploading '${allotmentFolderName}', probably some contractor has modified the folder name, Exiting.`
                );
                process.exit(1);
            }
        } else {
            lge(
                `Todays report json file '${instanceRunDateFormatted}_report.json' does not contain a key '${allotmentId}', which should have been created while allotment, Exiting.`
            );
            process.exit(1);
        }
        const updatedReportJSONObj = JSON.stringify(reportJSONObj, null, 3);
        fs.writeFileSync(reportJSONFilePath, updatedReportJSONObj, 'utf8');
        releaseLock(reportJSONFilePath, undefined, false);
    } catch (err) {
        lgc(err);
        releaseLock(reportJSONFilePath, undefined, false);
        process.exit(1);
    }
}

/**
 *
 * Function to add a blank column with the "Additional Images" heading, alternatively ( to write in excel)
 *
 */
function addAdditionalImagesColumnAlternatively(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = arr[i].length; j > 0; j--) {
            // Insert an empty string between elements
            if (j !== 1) {
                if (i === 1) {
                    // If it is the first row, copy the text from the previous cell
                    arr[i].splice(j, 0, arr[i][j - 1]);
                } else if (i === 2) {
                    // If it is the second row, put heading of Additional Images
                    arr[i].splice(j, 0, 'Additional Images');
                } else {
                    arr[i].splice(j, 0, undefined);
                }
            }
        }
    }
}

/**
 *
 * Styling constants for usage in excel exporting
 *
 */
const styleOfDateHeading = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '3366ff' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
};

const styleOfDealerNameHeadingEven = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: '3ba0bb' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'a6a6a6' } },
        bottom: { style: 'thin', color: { rgb: 'a6a6a6' } },
        left: { style: 'thin', color: { rgb: 'a6a6a6' } },
        right: { style: 'thin', color: { rgb: 'a6a6a6' } },
    },
};

const styleOfDealerNameHeadingOdd = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: 'c4d79b' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'a6a6a6' } },
        bottom: { style: 'thin', color: { rgb: 'a6a6a6' } },
        left: { style: 'thin', color: { rgb: 'a6a6a6' } },
        right: { style: 'thin', color: { rgb: 'a6a6a6' } },
    },
};

const centerAlign = {
    alignment: { horizontal: 'center' },
};

const rightAlign = {
    alignment: { horizontal: 'right' },
};

const normalFont = {
    font: { name: 'Arial', sz: 11 },
    alignment: { horizontal: 'center' },
};

const styleOfAdditionalImagesDataEven = {
    font: { name: 'Arial', sz: 11 },
    fill: { fgColor: { rgb: 'daeef3' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'a6a6a6' } },
        bottom: { style: 'thin', color: { rgb: 'a6a6a6' } },
        left: { style: 'thin', color: { rgb: 'a6a6a6' } },
        right: { style: 'thin', color: { rgb: 'a6a6a6' } },
    },
};

const styleOfAdditionalImagesDataOdd = {
    font: { name: 'Arial', sz: 11 },
    fill: { fgColor: { rgb: 'ebf1de' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'a6a6a6' } },
        bottom: { style: 'thin', color: { rgb: 'a6a6a6' } },
        left: { style: 'thin', color: { rgb: 'a6a6a6' } },
        right: { style: 'thin', color: { rgb: 'a6a6a6' } },
    },
};

const styleOfDealerTotal = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: '99ccff' } }, // Background color
    alignment: { horizontal: 'center' },
};

const styleOfAdditionalImagesTotalEven = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: 'daeef3' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'a6a6a6' } },
        bottom: { style: 'thin', color: { rgb: 'a6a6a6' } },
        left: { style: 'thin', color: { rgb: 'a6a6a6' } },
        right: { style: 'thin', color: { rgb: 'a6a6a6' } },
    },
};

const styleOfAdditionalImagesTotalOdd = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: 'ebf1de' } }, // Background color
    alignment: { wrapText: true, horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'a6a6a6' } },
        bottom: { style: 'thin', color: { rgb: 'a6a6a6' } },
        left: { style: 'thin', color: { rgb: 'a6a6a6' } },
        right: { style: 'thin', color: { rgb: 'a6a6a6' } },
    },
};

const styleOfGrandTotalOnBottomRight = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1f487d' } }, // Background color
    alignment: { horizontal: 'center' },
    // font: { name: 'Arial', sz: 12 },
    // fill: { fgColor: { rgb: '5D90C3' } }, // Background color
    // alignment: { horizontal: 'center' },
};

const styleOfTotalInventory = {
    font: { name: 'Arial', sz: 12 } /** , color: { rgb: 'FFFFFF' } */,
    fill: { fgColor: { rgb: 'E4BE9E' } }, // Background color
    alignment: { horizontal: 'center' },
};

const styleOfFTPOrAdditionalImagesTotal = {
    font: { name: 'Arial', sz: 12 } /** , color: { rgb: 'FFFFFF' } */,
    fill: { fgColor: { rgb: 'D9D2B6' } }, // Background color
    alignment: { horizontal: 'center' },
};

const styleOfGrandTotal = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '3366ff' } }, // Background color
    alignment: { horizontal: 'center' },
};

const styleOfDifference = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'eb4034' }, bold: true },
    alignment: { horizontal: 'center' },
};

const styleOfFTPDealerNameHeading = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: 'B7DEE8' } }, // Background color
    alignment: { horizontal: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
    },
};

const styleOfDailyInventoryHeading = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1f487d' } }, // Background color
    alignment: { horizontal: 'center' },
};

const styleOfAdditionalImagesTotalHeading = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: 'A8577E' } }, // Background color C8C2AE
    alignment: { wrapText: true, horizontal: 'center' },
};

/**
 *
 *
 * Styling for Vertical list of dealers and their sum excel
 *
 *
 *
 */

const styleOfVerticalListHeading = {
    font: { name: 'Calibri', sz: 14 },
    fill: { fgColor: { rgb: '94b2d6' } }, // Background color
    alignment: { horizontal: 'center' },
};

const styleOfVerticalListDealerNameNormalData = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: 'B7DEE8' } }, // Background color
    alignment: { horizontal: 'left' },
};

const styleOfVerticalListDealerNameFTPData = {
    font: { name: 'Arial', sz: 12 },
    fill: { fgColor: { rgb: '8db4e2' } }, // Background color
    alignment: { horizontal: 'left' },
};

const styleOfVerticalListDealerNameTextTotalData = {
    font: { name: 'Calibri', sz: 18 },
    fill: { fgColor: { rgb: '4babc6' } },
    alignment: { horizontal: 'left' },
};

const styleOfVerticalListDealerNumber = {
    font: { name: 'Calibri', sz: 12 },
    alignment: { horizontal: 'left' },
};

const styleOfVerticalListDealerQty = {
    font: { name: 'Calibri', sz: 12 },
    alignment: { horizontal: 'center' },
};

const styleOfVerticalListDataTotal = {
    font: { name: 'Calibri', sz: 18 },
    fill: { fgColor: { rgb: '4babc6' } },
    alignment: { horizontal: 'center' },
};

/**
 *
 *
 * Styling for individual contractor report
 *
 *
 *
 */

const contractorExcelStyleOfTopHeadingRow = {
    font: { name: 'Arial', sz: 12, color: { rgb: 'FFFFFF' }, bold: true },
    fill: { fgColor: { rgb: '800080' } }, // Background color
    alignment: { horizontal: 'center' },
};

const contractorExcelStyleOfBottomTotalRow = {
    font: { name: 'Arial', sz: 14, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'c5d9f1' } }, // Background color
    alignment: { horizontal: 'center' },
};

export {
    addAllotmentToReport,
    addUploadingToReport,
    addAdditionalImagesColumnAlternatively,
    styleOfDateHeading,
    centerAlign,
    rightAlign,
    normalFont,
    styleOfAdditionalImagesDataEven,
    styleOfAdditionalImagesDataOdd,
    styleOfGrandTotalOnBottomRight,
    styleOfDealerTotal,
    styleOfAdditionalImagesTotalEven,
    styleOfAdditionalImagesTotalOdd,
    // Bottom part of the sheet
    styleOfTotalInventory,
    styleOfFTPOrAdditionalImagesTotal,
    styleOfGrandTotal,
    styleOfDifference,
    //
    styleOfFTPDealerNameHeading,
    styleOfDailyInventoryHeading,
    styleOfAdditionalImagesTotalHeading,
    styleOfDealerNameHeadingEven,
    styleOfDealerNameHeadingOdd,
    //
    styleOfVerticalListHeading,
    styleOfVerticalListDealerNameNormalData,
    styleOfVerticalListDealerNameFTPData,
    styleOfVerticalListDealerNameTextTotalData,
    styleOfVerticalListDealerNumber,
    styleOfVerticalListDealerQty,
    styleOfVerticalListDataTotal,
    //
    contractorExcelStyleOfTopHeadingRow,
    contractorExcelStyleOfBottomTotalRow,
};
