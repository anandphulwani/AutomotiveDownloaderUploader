// ONPROJECTFINISH: Do cleanup
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { question } from 'readline-sync';
import beautify from 'json-beautify';

/* eslint-disable import/extensions */
import { zeroPad } from './stringformatting.js';
import { config } from '../configs/config.js';
import { attainLock, releaseLock, lge, lgi, lgs, lgu, lgd, lgtf } from './loggerandlocksupportive.js';
import { getIndexOfHighestIn2DArrayColumn } from './others.js';
import { createDirAndCopyFile, createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty } from './filesystem.js';
import { setCurrentDealerConfiguration, getAddTextToFolderNameFromDC } from './excelsupportive.js';
import { addToContractorsCurrentAllotted } from './configsupportive.js';
import { addAllotmentToReport } from './reportsupportive.js';
import { getBookmarkFolderGUIDFromUsernameDealerNumber, replaceBookmarksElementByGUIDAndWriteToBookmarksFile } from './bookmark.js';
import {
    recalculateRatioOfImagesAlloted,
    recalculateAllotmentPriority,
    getDealerFolderContractorsZonePath,
    getDealerFolderRecordKeepingZonePath,
} from './allotmentsupportive.js';
import Color from '../class/Colors.js';
/* eslint-enable import/extensions */

const contractorsNames = Object.values(config.contractors).filter((contractor) => contractor.normalThreshold >= 0);

/* #region Validation Checks, fn validationDoAllotment() */
function validationDoAllotment(allotmentSystem, lotsMinimumDealerFoldersForEachContractors, lotsImagesQty, imagesQtyAllotedInCurrentLot) {
    if (
        allotmentSystem !== 'allotmentByMinimumDealerFoldersForEachContractors' &&
        allotmentSystem !== 'allotmentByImagesQty' &&
        allotmentSystem !== 'allotmentByManual'
    ) {
        lgu(
            `Unknown allotment system: '${allotmentSystem}' used, available systems are 'allotmentByMinimumDealerFoldersForEachContractors' and 'allotmentByImagesQty'.`
        );
        process.exit(1);
    }
    if (allotmentSystem === 'allotmentByMinimumDealerFoldersForEachContractors' && lotsMinimumDealerFoldersForEachContractors === undefined) {
        lgu(`Using allotment system: '${allotmentSystem}', 'lotsMinimumDealerFoldersForEachContractors' is undefined.`);
        process.exit(1);
    }
    if (allotmentSystem === 'allotmentByImagesQty' && lotsImagesQty > 0 && lotsImagesQty > imagesQtyAllotedInCurrentLot) {
        lgu(
            `Using allotment system: '${allotmentSystem}', condition is false: 'lotsImagesQty(${lotsImagesQty}) > 0 && lotsImagesQty(${lotsImagesQty}) > imagesQtyAllotedInCurrentLot(${imagesQtyAllotedInCurrentLot})'.`
        );
        process.exit(1);
    }
    if (
        (allotmentSystem === 'allotmentByImagesQty' || allotmentSystem === 'allotmentByManual') &&
        lotsImagesQty !== undefined &&
        lotsImagesQty > 0 &&
        imagesQtyAllotedInCurrentLot >= lotsImagesQty
    ) {
        lgu(
            `While alloting by 'allotmentByImagesQty', found no of images alloted in the current lot (imagesQtyAllotedInCurrentLot): ${imagesQtyAllotedInCurrentLot} exceeded lot's image quantity (lotsImagesQty): ${lotsImagesQty}.` +
                `\nPossible chances of manual intervention of adding folder or images by the user in the lot folder`
        );
        process.exit(1);
    }
}
/* #endregion */

let earlierLoopUsernameFolder = '';

// allotmentSystem = allotmentByImagesQty
// allotmentSystem = allotmentByMinimumDealerFoldersForEachContractors
async function doAllotment(
    allotmentSystem,
    lotsMinimumDealerFoldersForEachContractors,
    lotsImagesQty,

    dealerDirectories,
    contractors,
    lotIndex,
    imagesQtyAllotedInCurrentLot,
    foldersAlloted,

    isDryRun = false,
    isAutomaticAllotment = true,
    debug = false
) {
    validationDoAllotment(allotmentSystem, lotsMinimumDealerFoldersForEachContractors, lotsImagesQty, imagesQtyAllotedInCurrentLot);
    let doesDestinationFolderAlreadyExists = false;
    let minDealerFolders;
    if (allotmentSystem === 'allotmentByMinimumDealerFoldersForEachContractors') {
        minDealerFolders = lotsMinimumDealerFoldersForEachContractors * contractorsNames.length;
    }

    for (
        let index = 0;
        dealerDirectories.length > 0 && (allotmentSystem !== 'allotmentByMinimumDealerFoldersForEachContractors' || index < minDealerFolders);
        index++
    ) {
        const [dealerFolderPath, dealerFolderFilesCount] = dealerDirectories[0];
        const usernameFolder = path.basename(path.dirname(dealerFolderPath));
        if (usernameFolder !== earlierLoopUsernameFolder) {
            setCurrentDealerConfiguration(usernameFolder);
            earlierLoopUsernameFolder = usernameFolder;
        }
        const sourceDealerFolderName = `${usernameFolder}/${path.basename(dealerFolderPath)}`;

        if (allotmentSystem !== 'allotmentByMinimumDealerFoldersForEachContractors') {
            contractors = recalculateAllotmentPriority(recalculateRatioOfImagesAlloted(contractors));
        }

        let contractorsIndex;
        if (isAutomaticAllotment) {
            if (allotmentSystem === 'allotmentByMinimumDealerFoldersForEachContractors') {
                contractorsIndex = index % contractors.length;
            } else if (allotmentSystem === 'allotmentByImagesQty') {
                contractorsIndex = getIndexOfHighestIn2DArrayColumn(contractors, 5);
            }
        } else {
            const contractorsSortedByPriority = contractors.map((contractor) => [...contractor]);
            contractorsSortedByPriority.sort((a, b) => {
                if (a[5] === b[5]) {
                    return 0;
                }
                return a[5] > b[5] ? -1 : 1;
            });
            let currentPrioritySingleLine = 'Current priority: ';
            // eslint-disable-next-line no-loop-func
            contractorsSortedByPriority.forEach((value, innerIndex) => {
                const indexOfContractor = contractorsNames.indexOf(value[0]) + 1;
                let contractorSection = `[${indexOfContractor}]${value[0]} (${value[3]}/${value[5]})`;
                contractorSection += innerIndex < contractorsSortedByPriority.length - 1 ? '    ' : '';
                const lineNo = Math.floor(currentPrioritySingleLine.length / 120);
                const lineNoAfterAddingContractor = Math.floor((currentPrioritySingleLine.length + contractorSection.length) / 120);
                if (lineNo !== lineNoAfterAddingContractor) {
                    currentPrioritySingleLine += `${' '.repeat(
                        120 * lineNoAfterAddingContractor - currentPrioritySingleLine.length
                    )}                  ${contractorSection}`;
                } else {
                    currentPrioritySingleLine += contractorSection;
                }
            });
            console.log('');
            lgi(`Allot            ${sourceDealerFolderName.padEnd(20, ' ')} To                  ???????`.padEnd(120, ' '), Color.cyan);
            lgi(`${currentPrioritySingleLine}`, Color.cyan);
            // const cancelVal = index === 0 ? 'Exit' : false;
            // contractorsIndex = keyInSelect(contractorsNames, null, { cancel: cancelVal });

            // ONPROJECTFINISH: Check if you can replace this with lg* function below
            let allotmentQuestion = `\n${contractorsNames
                .map((contractorsName, contractorInnerIndex) =>
                    contractorsSortedByPriority[0][0] === contractorsName
                        ? chalk.black.bgWhiteBright(`[${contractorInnerIndex + 1}] ${contractorsName}`)
                        : `[${contractorInnerIndex + 1}] ${contractorsName}`
                )
                .join('\n')}\n`;
            allotmentQuestion = index === 0 ? (allotmentQuestion += `[0] EXIT\n`) : allotmentQuestion;
            lgi(allotmentQuestion, Color.white);
            const indexOfPriorityContractor = contractorsNames.indexOf(contractorsSortedByPriority[0][0]) + 1;
            do {
                contractorsIndex = question('', { defaultInput: indexOfPriorityContractor.toString() });
                if (
                    Number.isNaN(Number(contractorsIndex)) ||
                    (index === 0 && Number(contractorsIndex) < 0) ||
                    (index !== 0 && Number(contractorsIndex) < 1) ||
                    Number(contractorsIndex) > contractorsNames.length
                ) {
                    lge('Invalid input, please try again: ');
                }
            } while (
                Number.isNaN(Number(contractorsIndex)) ||
                (index === 0 && Number(contractorsIndex) < 0) ||
                (index !== 0 && Number(contractorsIndex) < 1) ||
                Number(contractorsIndex) > contractorsNames.length
            );
            contractorsIndex--;

            contractorsIndex = contractors.findIndex((innerArr) => innerArr.indexOf(contractorsNames[contractorsIndex]) !== -1);
            if (contractorsIndex === -1) {
                process.exit(0);
            }
        }

        const contractorAlloted = contractors[contractorsIndex][0];
        const uniqueIdOfFolder = zeroPad(lotIndex, 2) + zeroPad(foldersAlloted + 1, 3);
        const addTextToFolderName = `${getAddTextToFolderNameFromDC(
            path.basename(dealerFolderPath)
        )} ${contractorAlloted} ${dealerFolderFilesCount} (#${uniqueIdOfFolder})`.trim();
        const destinationPath = getDealerFolderContractorsZonePath(dealerFolderPath, contractorAlloted, addTextToFolderName);
        const destinationRecordKeepingPath = getDealerFolderRecordKeepingZonePath(dealerFolderPath, addTextToFolderName);
        const destinationDealerFolderName = `${path.basename(path.dirname(destinationPath))}/${path.basename(destinationPath)}`;

        if (!isDryRun) {
            const bookmarkFolderGUID = getBookmarkFolderGUIDFromUsernameDealerNumber(usernameFolder, path.basename(dealerFolderPath));
            replaceBookmarksElementByGUIDAndWriteToBookmarksFile('foldername', bookmarkFolderGUID, uniqueIdOfFolder);

            createDirAndCopyFile(dealerFolderPath, destinationRecordKeepingPath);
            createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(dealerFolderPath, destinationPath, false, 3);
            await addToContractorsCurrentAllotted(contractorAlloted, dealerFolderFilesCount);
            addAllotmentToReport([
                [
                    `#${uniqueIdOfFolder}`,
                    sourceDealerFolderName,
                    contractorAlloted,
                    dealerFolderFilesCount,
                    path.basename(destinationDealerFolderName),
                ],
            ]);
        } else {
            const pathsToCheck = [destinationRecordKeepingPath, destinationPath];
            for (let i = 0; i < pathsToCheck.length; i++) {
                if (fs.existsSync(pathsToCheck[i])) {
                    lge(`Folder: ${pathsToCheck[i]} already exists, cannot process ${dealerFolderPath} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
            }
        }
        lgi(
            `${sourceDealerFolderName.padEnd(30, ' ')}  Alloted To         ${`${contractorAlloted} (${destinationDealerFolderName})`}`.padEnd(
                120,
                ' '
            ),
            Color.bgCyan
        );
        foldersAlloted++;

        contractors[contractorsIndex][3] += dealerFolderFilesCount;
        imagesQtyAllotedInCurrentLot += dealerFolderFilesCount;
        dealerDirectories.shift();

    }
    return [dealerDirectories, contractors, imagesQtyAllotedInCurrentLot, foldersAlloted, doesDestinationFolderAlreadyExists];
}

// eslint-disable-next-line import/prefer-default-export
export { doAllotment };
