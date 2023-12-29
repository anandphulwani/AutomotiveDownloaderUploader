// ONPROJECTFINISH: Do cleanup
/* #region : Supporting functions */ /* #endregion */
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { keyInYN } from 'readline-sync';
import cfonts from 'cfonts';
import beautify from 'json-beautify';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted } from './functions/datetime.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import { lge, lgw, lgif, lgi, lgtf, lgd } from './functions/loggerandlocksupportive.js';
import { zeroPad } from './functions/stringformatting.js';
import { config } from './configs/config.js';
import { makeDir, getListOfSubfoldersStartingWith } from './functions/filesystem.js';
import { createProcessingAndRecordKeepingFolders, setContractorsCurrentAllotted, setLastLotNumberAndDate } from './functions/configsupportive.js';
import {
    recalculateRatioOfThreshHoldWithOtherContractors,
    validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs,
    returnImageCountFromDealerDirs,
} from './functions/allotmentsupportive.js';
import { doAllotment } from './functions/allotment.js';
import { printSectionSeperator } from './functions/others.js';
import FolderToBeAllotted from './class/FolderToBeAllotted.js';
/* eslint-enable import/extensions */

const debug = false;
lgtf(`region : Validation section 01: BEGIN`);
/* #region : Validation section 01: BEGIN */
if (process.argv.length < 3) {
    lge(
        `Please start the program with right parameter 'node contractors_allotment.js lotNoIndex' or 'node contractors_allotment.js lotNoIndex YYYY-MM-DD'.`
    );
    process.exit(1);
}
if (Number.isNaN(Number(process.argv[2]))) {
    lge(
        `Please start the program with proper parameters 'node contractors_allotment.js lotNoIndex' or 'node contractors_allotment.js lotNoIndex YYYY-MM-DD', The first parameter(lotNoIndex) has to be a number.`
    );
    process.exit(1);
}
if (!Object.keys(config.contractors).length > 0) {
    lge(`No contractors available in config or the length is zero, please check config file.`);
    process.exit(1);
}
/* #endregion */
lgtf(`region : Validation section 01: END`);

const lotIndex = parseInt(process.argv[2], 10);
const lotFolderName = `Lot_${zeroPad(lotIndex, 2)}`;
const lotTodaysDate = process.argv[3] !== undefined ? process.argv[3] : instanceRunDateFormatted;
const { downloadPath } = config;
const lotFolderPath = `${downloadPath}\\${lotTodaysDate}\\${lotFolderName}`; // ${config.downloadPath}/${lotTodaysDate}/Lot_${zeroPad(lotIndex, 2)}/${usernameTrimmed}/${dealerFolder}/${VINNumber}/
const lotHeadingOptions = {
    font: 'block', // font to use for the output
    align: 'center', // alignment of the output
    colors: ['cyan', 'blue'], // colors of the output (gradient)
    background: 'black', // background color of the output
    letterSpacing: 1, // letter spacing of the output
    lineHeight: 1, // line height of the output
    space: true, // add space between letters
    maxLength: '0', // maximum length of the output (0 = unlimited)
};

lgtf(`Printing Lot number in a bold way`);
cfonts.say(lotFolderName.replace('_', ' '), lotHeadingOptions);

lgtf(`region : Validation section 02: BEGIN`);
/* #region : Validation section 02 */
if (!fs.existsSync(lotFolderPath)) {
    lge(`Lot folder path: ${lotFolderPath} does not exist, Please check.`);
    process.exit(1);
}

let hasLotFirstIndexMatches = false;
while (!hasLotFirstIndexMatches) {
    let LotFirstIndex = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${lotTodaysDate}`, 'Lot_');
    LotFirstIndex = LotFirstIndex.length > 0 ? parseInt(LotFirstIndex[0].substring(4), 10) : 1;
    if (LotFirstIndex !== lotIndex) {
        lge(`Please allot earlier lot folders 'Lot_${zeroPad(LotFirstIndex, 2)}', before alloting this lot folder '${lotFolderName}'.`);
        if (!keyInYN('Do you want to try again if you allotted to earlier lot folders (press Y), or exit the program entirely (press N)?')) {
            process.exit(0);
        }
    } else {
        hasLotFirstIndexMatches = true;
    }
}
/* #endregion */
lgtf(`region : Validation section 02: END`);

if (config.environment === 'production') {
    exec(`explorer.exe ${process.cwd()}\\${lotFolderPath}"`);
    while (!keyInYN('Please review your lot folders, to remove any unneccesary photos, press Y to continue?')) {
        sleep(1);
    }
}

const dealerDirectories = validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs(lotFolderPath);

if (!dealerDirectories.length > 0) {
    lge(`Lot folder path: ${lotFolderPath} does not contain any subfolders (dealer Folder), Please check.`);
    process.exit(1);
}

dealerDirectories.sort((a, b) => {
    /** Compare `username` folder first, from `username/dealerFolder` combination */
    const folderNameA = path.dirname(a).split(path.sep).pop();
    const folderNameB = path.dirname(b).split(path.sep).pop();
    // Compare folder names
    if (folderNameA < folderNameB) return -1;
    if (folderNameA > folderNameB) return 1;

    /** If `username` foldername are equal, compare based on numerical part in `dealerFolder` */
    const regex = /\d+/;
    const baseNameA = path.basename(a);
    const baseNameB = path.basename(b);
    const numberA = parseInt(baseNameA.match(regex)[0], 10);
    const numberB = parseInt(baseNameB.match(regex)[0], 10);

    if (numberA === numberB) {
        return 0;
    }
    return numberA - numberB;
});

lgtf(`dealerDirectories: ${beautify(dealerDirectories, null, 3, 120)}`);
lgtf(`Object.keys(config.contractors): ${beautify(Object.keys(config.contractors), null, 3, 120)}`);

createProcessingAndRecordKeepingFolders(lotTodaysDate);

function getContractors(onlyValid) {
    let contractors = [];
    let totalNoOfNormalThreshold = 0;
    let contractorsFromConfig;
    if (onlyValid) {
        contractorsFromConfig = Object.entries(config.contractors)
            .filter(([_, contractor]) => contractor.normalThreshold >= 0)
            .reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
            }, {});
    } else {
        contractorsFromConfig = Object.entries(config.contractors).reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj;
        }, {});
    }
    /**
     * Set contractors currentstatus to 0 if lot no is 1
     * Reading all name and normalThreshold to contractors array
     * Adding all normalThreshold to totalNoOfNormalThreshold
     */
    // eslint-disable-next-line no-restricted-syntax
    for (const contractor of Object.keys(contractorsFromConfig)) {
        if (lotIndex === 1) {
            setContractorsCurrentAllotted(contractor, '0');
        }
        const { normalThreshold } = contractorsFromConfig[contractor];
        contractors.push([contractor, normalThreshold]);
        totalNoOfNormalThreshold += normalThreshold;
    }
    lgtf(
        `contractors from config after removing contractors whose normalThreshold is not -1 and is above or equal to 0: ${beautify(
            contractors,
            null,
            3,
            120
        )}`
    );

    contractors.sort((a, b) => {
        if (a[1] === b[1]) {
            return 0;
        }
        return a[1] > b[1] ? -1 : 1;
    });
    lgtf(`contractors sorted: ${beautify(contractors, null, 3, 120)}`);

    contractors = recalculateRatioOfThreshHoldWithOtherContractors(contractors, totalNoOfNormalThreshold, debug);
    lgtf(`contractors ratio calculated: ${beautify(contractors, null, 3, 120)}`);

    /**
     * Reading currentAllotted(ImagesAllotted) from the config, and appending it as the last column to generate `Example01` below.
     * And appending a 0 to all the last column if the Lot is 01, to generate `Example02` below, since config is old read.
     */
    /* #region: Examples */
    /**
     * `Example01`
     * [
     * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAllotted ],
     *    [ 'ram', 300, 43, 50 ],
     *    [ 'karan', 100, 14, 40 ],
     *    [ 'pavan', 100, 14, 40 ],
     *    [ 'arjun', 100, 14, 30 ],
     *    [ 'om', 100, 14, 30 ]
     * ]
     *
     * `Example02`
     * [
     * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAllotted ],
     *    [ 'ram', 300, 43, 0 ],
     *    [ 'karan', 100, 14, 0 ],
     *    [ 'pavan', 100, 14, 0 ],
     *    [ 'arjun', 100, 14, 0 ],
     *    [ 'om', 100, 14, 0 ]
     * ]
     */
    /* #endregion */
    contractors.forEach((contractor) => {
        if (lotIndex === 1) {
            contractor.push(0);
        } else {
            const { currentAllotted } = config.contractors[contractor[0]];
            contractor.push(currentAllotted);
        }
    });
    lgtf(`contractors currentAllotted set: ${beautify(contractors, null, 3, 120)}`);
    return contractors;
}

let dealerDirectoriesObjects = dealerDirectories.map((dealerFolderPath) => new FolderToBeAllotted(dealerFolderPath));
for (let index = 0; index < 2; index++) {
    const contractors = getContractors(true);
    debug ? lgd(`dealerDirectories: ${beautify(dealerDirectories, null, 3, 120)}`) : null;
    debug ? lgd(`contractors: ${beautify(contractors, null, 3, 120)}`) : null;

    const doesDestinationFolderAlreadyExists = doAllotment(
        dealerDirectoriesObjects,
        contractors.map((subArr) => [...subArr]),
        lotIndex,
        false,
        debug
    );
    if (doesDestinationFolderAlreadyExists) {
        process.exit(1);
    }
    if (index === 1) {
        setLastLotNumberAndDate(lotFolderName, lotTodaysDate);
        printSectionSeperator();
        debug ? lgd(`contractors: ${beautify(contractors, null, 3, 120)}`) : null;
        process.exit(0);
    }
    printSectionSeperator();
    console.log('');
    if (!keyInYN('To continue with the above allotment press Y, for other options press N.')) {
        break;
    }
    console.log('');
}

if (keyInYN('To use manual allotment system press Y, to exit from this process press N.')) {
    const contractors = getContractors(false);
    dealerDirectoriesObjects = dealerDirectories.map((dealerFolderPath) => new FolderToBeAllotted(dealerFolderPath));
    for (let index = 0; index < 2; index++) {
        console.log('');
        doAllotment(dealerDirectoriesObjects, contractors, lotIndex, true, debug);
        if (index === 1) {
            setLastLotNumberAndDate(lotFolderName, lotTodaysDate);
        }
        printSectionSeperator();
    }
}
