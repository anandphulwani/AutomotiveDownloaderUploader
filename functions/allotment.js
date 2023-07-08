// ONPROJECTFINISH: Do cleanup
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { question } from 'readline-sync';

/* eslint-disable import/extensions */
import { zeroPad } from './stringformatting.js';
import { config } from '../configs/config.js';
import { lge } from './loggersupportive.js';
import { getIndexOfHighestIn2DArrayColumn } from './others.js';
import { createDirAndCopyFile, createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty } from './filesystem.js';
import { setCurrentDealerConfiguration, getAddTextToFolderNameFromDC } from './excelsupportive.js';
import { addToContractorsCurrentAllotted } from './configsupportive.js';
import { getBookmarkFolderGUIDFromUsernameDealerNumber, replaceBookmarksFolderNameOnGUIDAndWriteToBookmarksFile } from './bookmark.js';
import {
    recalculateRatioOfImagesAlloted,
    recalculateAllotmentPriority,
    getDealerFolderContractorsZonePath,
    getDealerFolderRecordKeepingZonePath,
} from './allotmentsupportive.js';
import { attainLock, releaseLock } from './locksupportive.js';
/* eslint-enable import/extensions */

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
    isAutomaticAllotment = true
) {
    let doesDestinationFolderAlreadyExists = false;
    if (
        allotmentSystem !== 'allotmentByMinimumDealerFoldersForEachContractors' &&
        allotmentSystem !== 'allotmentByImagesQty' &&
        allotmentSystem !== 'allotmentByManual'
    ) {
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: Unknown allotment system: '${allotmentSystem}' used, available systems are 'allotmentByMinimumDealerFoldersForEachContractors' and 'allotmentByImagesQty'.`
            )
        );
        process.exit(1);
    }
    if (
        (allotmentSystem === 'allotmentByMinimumDealerFoldersForEachContractors' && lotsMinimumDealerFoldersForEachContractors !== false) ||
        (allotmentSystem === 'allotmentByImagesQty' && lotsImagesQty > 0 && lotsImagesQty > imagesQtyAllotedInCurrentLot) ||
        allotmentSystem === 'allotmentByManual'
    ) {
        let minDealerFolders;
        const contractorsNames = Object.keys(config.contractors);
        if (allotmentSystem === 'allotmentByMinimumDealerFoldersForEachContractors') {
            minDealerFolders = lotsMinimumDealerFoldersForEachContractors * contractorsNames.length;
        }
        const fileToOperateOn = config.processingBookmarkPathWithoutSync;
        attainLock(fileToOperateOn, undefined, true);

        for (
            let index = 0;
            (allotmentSystem === 'allotmentByMinimumDealerFoldersForEachContractors' && index < minDealerFolders && dealerDirectories.length > 0) ||
            (allotmentSystem === 'allotmentByImagesQty' && dealerDirectories.length > 0) ||
            (allotmentSystem === 'allotmentByManual' && dealerDirectories.length > 0);
            index++
        ) {
            // console.log(`minDealerFolders: ${minDealerFolders}             dealerDirectories.length: ${dealerDirectories.length}`);
            const dealerFolderPath = dealerDirectories[0][0];
            const dealerFolderFilesCount = dealerDirectories[0][1];
            const usernameFolder = path.basename(path.dirname(dealerFolderPath));
            if (usernameFolder !== earlierLoopUsernameFolder) {
                setCurrentDealerConfiguration(usernameFolder);
                earlierLoopUsernameFolder = usernameFolder;
            }
            const sourceDealerFolderName = `${usernameFolder}/${path.basename(dealerFolderPath)}`;

            if (allotmentSystem === 'allotmentByImagesQty' || allotmentSystem === 'allotmentByManual') {
                contractors = recalculateRatioOfImagesAlloted(contractors);
                contractors = recalculateAllotmentPriority(contractors);
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
                console.log(
                    chalk.cyan.bold(`Allot            ${sourceDealerFolderName.padEnd(20, ' ')} To                  ???????`.padEnd(120, ' '))
                );
                console.log(chalk.cyan.bold(`${currentPrioritySingleLine}`));
                // const cancelVal = index === 0 ? 'Exit' : false;
                // contractorsIndex = keyInSelect(contractorsNames, null, { cancel: cancelVal });

                let allotmentQuestion = `\n${contractorsNames
                    .map((contractorsName, contractorInnerIndex) =>
                        contractorsSortedByPriority[0][0] === contractorsName
                            ? chalk.black.bgWhiteBright(`[${contractorInnerIndex + 1}] ${contractorsName}`)
                            : `[${contractorInnerIndex + 1}] ${contractorsName}`
                    )
                    .join('\n')}\n`;
                allotmentQuestion = index === 0 ? (allotmentQuestion += `[0] EXIT\n`) : allotmentQuestion;
                console.log(allotmentQuestion);
                const indexOfPriorityContractor = contractorsNames.indexOf(contractorsSortedByPriority[0][0]) + 1;
                do {
                    contractorsIndex = question('', { defaultInput: indexOfPriorityContractor.toString() });
                    if (
                        Number.isNaN(Number(contractorsIndex)) ||
                        (index === 0 && Number(contractorsIndex) < 0) ||
                        (index !== 0 && Number(contractorsIndex) < 1) ||
                        Number(contractorsIndex) > contractorsNames.length
                    ) {
                        console.log('Invalid input, please try again: ');
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
                await replaceBookmarksFolderNameOnGUIDAndWriteToBookmarksFile(bookmarkFolderGUID, uniqueIdOfFolder, false);

                createDirAndCopyFile(dealerFolderPath, destinationRecordKeepingPath);
                await createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(dealerFolderPath, destinationPath, 3);
            } else {
                if (fs.existsSync(`${destinationRecordKeepingPath}`)) {
                    lge(`Folder: ${destinationRecordKeepingPath} already exists, cannot copy ${dealerFolderPath} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
                if (fs.existsSync(`${destinationPath}`)) {
                    lge(`Folder: ${destinationPath} already exists, cannot move ${dealerFolderPath} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
            }
            console.log(
                chalk.bgCyan.bold(
                    `${sourceDealerFolderName.padEnd(30, ' ')}  Alloted To         ${`${contractorAlloted} (${destinationDealerFolderName})`}`.padEnd(
                        120,
                        ' '
                    )
                )
            );
            if (!isDryRun) {
                await addToContractorsCurrentAllotted(contractorAlloted, dealerFolderFilesCount);
            }
            foldersAlloted++;

            contractors[contractorsIndex][3] += dealerFolderFilesCount;
            imagesQtyAllotedInCurrentLot += dealerFolderFilesCount;
            dealerDirectories.shift();

            // console.log(`imagesQtyAllotedInCurrentLot: ${imagesQtyAllotedInCurrentLot}, contractors after folder ${foldersAlloted} allotted: `);
            // console.log(contractors);
        }
        releaseLock(fileToOperateOn, undefined, true);
    } else if (
        (allotmentSystem === 'allotmentByImagesQty' || allotmentSystem === 'allotmentByManual') &&
        lotsImagesQty > 0 &&
        imagesQtyAllotedInCurrentLot >= lotsImagesQty
    ) {
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: While alloting by 'allotmentByImagesQty', found no of images alloted in the curretn lot (imagesQtyAllotedInCurrentLot): ${imagesQtyAllotedInCurrentLot} exceeded lot's image quantity (lotsImagesQty): ${lotsImagesQty}.` +
                    `\nPossible chances of manual intervention of adding folder or images by the user in the lot folder`
            )
        );
    }
    return [dealerDirectories, contractors, imagesQtyAllotedInCurrentLot, foldersAlloted, doesDestinationFolderAlreadyExists];
}

// eslint-disable-next-line import/prefer-default-export
export { doAllotment };
