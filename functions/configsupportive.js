import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { attainLock, releaseLock, lgc, lgs, lgu } from './loggerandlocksupportive.js';
import { config } from '../configs/config.js';
import { waitForMilliSeconds } from './sleep.js';
import { createBackupOfFile } from './datastoresupportive.js';
import { makeDir } from './filesystem.js';
import { instanceRunDateFormatted } from './datetime.js';
import { getProjectConfigContractorsFilePath, getProjectConfigFilePath, getProjectConfigLotLastFilePath } from './projectpaths.js';
/* eslint-enable import/extensions */

function getCredentialsForUsername(username) {
    const configCredentials = config.credentials;
    const singleelement = configCredentials.filter((a) => a.username === username)[0];
    return singleelement;
    // const { password } = singleelement;
    // return password;
}

function getIgnoreBookmarkURLObjects() {
    const ignoreBookmarkURLObjects = config.ignoreBookmarkURLS;
    let ignoreBookmarkURLText = JSON.stringify(ignoreBookmarkURLObjects);
    ignoreBookmarkURLText = ignoreBookmarkURLText.replaceAll('{config.appDomain}', config.appDomain);
    return JSON.parse(ignoreBookmarkURLText);
}

function getAppDomain() {
    return config.appDomain;
}

async function setContractorsCurrentAllotted(contractor, allottedQty) {
    const fileToOperateOn = getProjectConfigContractorsFilePath();
    attainLock(fileToOperateOn, undefined, true);

    try {
        const currentAllotted = getContractorsCurrentAllotted(contractor);
        if (currentAllotted === allottedQty) {
            releaseLock(fileToOperateOn, undefined, true);
            return;
        }
        const configUserContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\r\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
        const regexExpression = new RegExp(regexString, 'g');
        const newConfigUserContent = configUserContent.replace(regexExpression, `$1$2$3${allottedQty}$5`);
        if (configUserContent === newConfigUserContent) {
            lgu(
                `Unable to set contractors: '${contractor}', current allotted quantity to: '${allottedQty}'. Serious issue, please contact developer.`
            );
            releaseLock(fileToOperateOn, undefined, true);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigUserContent, 'utf8');
        createBackupOfFile(fileToOperateOn, newConfigUserContent);
        releaseLock(fileToOperateOn, undefined, true);
    } catch (err) {
        lgc(err);
        process.exit(1);
    }
}

function getContractorsCurrentAllotted(contractor) {
    const configUserContent = fs.readFileSync(getProjectConfigContractorsFilePath(), 'utf8');
    const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\r\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString, 'g');

    if (!regexExpression.test(configUserContent)) {
        lgu('Unable to match regex for fn getContractorsCurrentAllotted()');
        process.exit(1);
    }

    const match = configUserContent.match(regexExpression);
    const currentAllotted = match[0].match(regexString)[4];
    return currentAllotted;
}

async function addToContractorsCurrentAllotted(contractor, quantity) {
    let newQuantity = getContractorsCurrentAllotted(contractor);
    newQuantity = parseInt(newQuantity, 10);
    newQuantity += quantity;
    await setContractorsCurrentAllotted(contractor, newQuantity);
}

function getLastLotNumber() {
    const configContent = fs.readFileSync(getProjectConfigLotLastFilePath(), 'utf8');
    const lastLotNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',\\r\\n)`;
    const lastLotNumberRegexExpression = new RegExp(lastLotNumberRegexString, 'g');

    if (!lastLotNumberRegexExpression.test(configContent)) {
        lgu('Unable to match regex for fn getLastLotNumber()');
        process.exit(1);
    }
    const match = configContent.match(lastLotNumberRegexExpression);
    return match[0].match(lastLotNumberRegexString)[2];
}

function getLastLotDate() {
    const configContent = fs.readFileSync(getProjectConfigLotLastFilePath(), 'utf8');
    const lastLotDateRegexString = `(    lotLastRunDate: ')(.*?)(',\\r\\n)`;
    const lastLotDateRegexExpression = new RegExp(lastLotDateRegexString, 'g');

    if (!lastLotDateRegexExpression.test(configContent)) {
        lgu('Unable to match regex for fn getLastLotDate()');
        process.exit(1);
    }
    const match = configContent.match(lastLotDateRegexExpression);
    return match[0].match(lastLotDateRegexString)[2];
}

async function setLastLotNumberAndDate(lastLotNumber, lastLotDate) {
    const fileToOperateOn = getProjectConfigLotLastFilePath();
    attainLock(fileToOperateOn, undefined, true);

    try {
        const currentLotLastRunNumber = getLastLotNumber();
        const currentLotLastRunDate = getLastLotDate();
        if (currentLotLastRunNumber === lastLotNumber && currentLotLastRunDate === lastLotDate) {
            releaseLock(fileToOperateOn, undefined, true);
            return;
        }
        let configContent = fs.readFileSync(fileToOperateOn, 'utf8');
        let newConfigContent;

        if (currentLotLastRunNumber !== lastLotNumber) {
            const lastRunNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',\\r\\n)`;
            const lastRunNumberRegexExpression = new RegExp(lastRunNumberRegexString, 'g');
            newConfigContent = configContent.replace(lastRunNumberRegexExpression, `$1${lastLotNumber}$3`);
            if (configContent === newConfigContent) {
                lgu(`Unable to set lastLotNumber: '${lastLotNumber}'. Serious issue, please contact developer.`);
                releaseLock(fileToOperateOn, undefined, true);
                process.exit(1);
            }
            configContent = newConfigContent;
        }

        if (currentLotLastRunDate !== lastLotDate) {
            const lastRunDateRegexString = `(    lotLastRunDate: ')(.*?)(',\\r\\n)`;
            const lastRunDateRegexExpression = new RegExp(lastRunDateRegexString, 'g');
            newConfigContent = configContent.replace(lastRunDateRegexExpression, `$1${lastLotDate}$3`);
            if (configContent === newConfigContent) {
                lgu(`Unable to set lastLotDate: '${lastLotDate}'. Serious issue, please contact developer.`);
                releaseLock(fileToOperateOn, undefined, true);
                process.exit(1);
            }
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        createBackupOfFile(fileToOperateOn, newConfigContent);
        releaseLock(fileToOperateOn, undefined, true);
    } catch (err) {
        lgc(err);
        process.exit(1);
    }
}

const contractorsNames = Object.entries(config.contractors)
    .filter(([, value]) => value.normalThreshold >= 0)
    .map(([key]) => key);

function getLotConfigPropertiesValues(lotIndex) {
    const { minimumDealerFoldersForEachContractors, imagesQty } = config.lot[lotIndex - 1];
    const lotCfgImagesQty = imagesQty === 0 ? undefined : imagesQty;
    const lotCfgMinDealerFolders =
        minimumDealerFoldersForEachContractors === false || minimumDealerFoldersForEachContractors === undefined
            ? undefined
            : minimumDealerFoldersForEachContractors * contractorsNames.length;
    return { lotCfgMinDealerFolders, lotCfgImagesQty };
}

/**
 *
 * Creating folders according to cutter or finisher(cutter+finisher)
 * Also creating extraProcessingFolders mentioned in config
 *
 * processingFolderFormat: contractor/date/processingFolder/
 * processingFolders: '001_CuttingDone' (cutter), '003_FinishingBuffer' (finisher), '004_ReadyToUpload' (finisher)
 * recordKeepingFolderFormat: contractor/recordKeepingFolders/date/
 * recordKeepingFolders: '002_CuttingAccounting' (cutter), '005_FinishingAccounting' (finisher)
 *
 */
function createProcessingAndRecordKeepingFolders(dateToCreate) {
    const finishers = [...new Set(Object.values(config.contractors).map((contractor) => contractor.finisher))];
    // eslint-disable-next-line no-restricted-syntax
    for (const contractor of Object.keys(config.contractors)) {
        /**
         * Creation of processingFolders
         */
        const { cutterProcessingFolders, cutterRecordKeepingFolders } = config;
        for (let i = 0; i < cutterProcessingFolders.length; i++) {
            const cutterProcessingFolderPath = `${config.contractorsZonePath}\\${contractor}\\${dateToCreate}\\${cutterProcessingFolders[i]}`;
            if (!fs.existsSync(cutterProcessingFolderPath)) {
                makeDir(cutterProcessingFolderPath);
            }
        }
        for (let i = 0; i < cutterRecordKeepingFolders.length; i++) {
            const cutterRecordKeepingFolderPath = `${config.contractorsRecordKeepingPath}\\${contractor}_Acnt\\${cutterRecordKeepingFolders[i]}\\${dateToCreate}`;
            if (!fs.existsSync(cutterRecordKeepingFolderPath)) {
                makeDir(cutterRecordKeepingFolderPath);
            }
        }
        /**
         * If contractor is a finisher, then create finisher
         */
        if (finishers.includes(contractor)) {
            const { finisherProcessingFolders, finisherRecordKeepingFolders } = config;
            for (let i = 0; i < finisherProcessingFolders.length; i++) {
                const finisherProcessingFolderPath = `${config.contractorsZonePath}\\${contractor}\\${dateToCreate}\\${finisherProcessingFolders[i]}`;
                if (!fs.existsSync(finisherProcessingFolderPath)) {
                    makeDir(finisherProcessingFolderPath);
                }
            }
            for (let i = 0; i < finisherRecordKeepingFolders.length; i++) {
                const finisherRecordKeepingFolderPath = `${config.contractorsRecordKeepingPath}\\${contractor}_Acnt\\${finisherRecordKeepingFolders[i]}\\${dateToCreate}`;
                if (!fs.existsSync(finisherRecordKeepingFolderPath)) {
                    makeDir(finisherRecordKeepingFolderPath);
                }
            }
        }

        /**
         * Creation of extraProcessingFolders as mentioned in the config
         */
        const { extraProcessingFolders } = config.contractors[contractor];
        for (let i = 0; i < extraProcessingFolders.length; i++) {
            const extraProcessingFolderPath = `${config.contractorsZonePath}\\${contractor}\\${dateToCreate}\\${extraProcessingFolders[i]}`;
            if (!fs.existsSync(extraProcessingFolderPath)) {
                makeDir(extraProcessingFolderPath);
            }
        }
    }
}

// eslint-disable-next-line import/prefer-default-export
export {
    getCredentialsForUsername,
    getIgnoreBookmarkURLObjects,
    getAppDomain,
    setContractorsCurrentAllotted,
    getContractorsCurrentAllotted,
    addToContractorsCurrentAllotted,
    setLastLotNumberAndDate,
    getLotConfigPropertiesValues,
    createProcessingAndRecordKeepingFolders,
};
