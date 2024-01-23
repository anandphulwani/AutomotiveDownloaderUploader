import fs from 'fs';

/* eslint-disable import/extensions */
import { attainLock, releaseLock, lgc, lgu } from './loggerandlocksupportive.js';
import { config } from '../configs/config.js';
import { makeDir } from './filesystem.js';
import {
    getProjectConfigContractorsFilePath,
    getProjectConfigDevelopmentFilePath,
    getProjectConfigFilePath,
    getProjectConfigLotLastFilePath,
    getProjectConfigProductionFilePath,
    getProjectConfigUserFilePath,
} from './projectpaths.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
import { escapeSpecialCharacters } from './stringformatting.js';
/* eslint-enable import/extensions */

function getCredentialsForUsername(username) {
    const configCredentials = config.credentials;
    const singleelement = configCredentials.filter((a) => a.username === username)[0];
    return singleelement;
}

function getCredentialsKeysValueByUsernameRegexString(username, keyToSearch) {
    let passwordEncryptedRegex = '';
    passwordEncryptedRegex += `(`;
    passwordEncryptedRegex += ` +credentials: \\[`;
    passwordEncryptedRegex += `(?:(?![\\[\\]])[\\s\\S])*?`;
    passwordEncryptedRegex += `\\{`;
    passwordEncryptedRegex += `(?:(?![\\[\\]\\{\\}])(?![\\r\\n|\\n][ ]*//)[\\s\\S])*?`;
    passwordEncryptedRegex += `username: `;
    passwordEncryptedRegex += `'`;
    passwordEncryptedRegex += escapeSpecialCharacters(username);
    passwordEncryptedRegex += `'`;

    passwordEncryptedRegex += `(?:(?![\\[\\]\\{\\}])(?![\\r\\n|\\n][ ]*//)[\\s\\S])*?`;
    passwordEncryptedRegex += `${keyToSearch}: `;
    passwordEncryptedRegex += `'`;
    passwordEncryptedRegex += `)`;

    passwordEncryptedRegex += `.*`;

    passwordEncryptedRegex += `(`;
    passwordEncryptedRegex += `'`;
    passwordEncryptedRegex += `(?:(?![\\[\\]\\{\\}])[\\s\\S])*?`;
    passwordEncryptedRegex += `\\}`;
    passwordEncryptedRegex += `(?:(?![\\[\\]])[\\s\\S])*?`;
    passwordEncryptedRegex += `\\]`;
    passwordEncryptedRegex += `)`;
    return passwordEncryptedRegex;
}

function setCredentialsKeysValue(username, credentialsKey, credentialsValue) {
    const filesToOperateOn = [
        getProjectConfigFilePath(),
        getProjectConfigUserFilePath(),
        getProjectConfigDevelopmentFilePath(),
        getProjectConfigProductionFilePath(),
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const fileToOperateOn of filesToOperateOn) {
        attainLock(fileToOperateOn, undefined, false);
        try {
            const configContent = syncOperationWithErrorHandling(fs.readFileSync, fileToOperateOn, 'utf8');

            const credentialBlockRegexString = getCredentialsKeysValueByUsernameRegexString(username, credentialsKey);
            const credentialBlockRegexExpression = new RegExp(credentialBlockRegexString);

            if (credentialBlockRegexExpression.test(configContent)) {
                const newConfigContent = configContent.replace(credentialBlockRegexExpression, `$1${credentialsValue}$2`);
                if (configContent === newConfigContent) {
                    lgu(`Unable to set '${credentialsKey}': '${credentialsValue}' for '${username}'. Serious issue, please contact developer.`);
                    releaseLock(fileToOperateOn, undefined, false);
                    process.exit(1);
                }
                syncOperationWithErrorHandling(fs.writeFileSync, fileToOperateOn, newConfigContent, 'utf8');
            }
            releaseLock(fileToOperateOn, undefined, false);
        } catch (err) {
            lgc(err);
            process.exit(1);
        }
    }
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

function setContractorsCurrentAllotted(contractor, allottedQty) {
    const fileToOperateOn = getProjectConfigContractorsFilePath();
    attainLock(fileToOperateOn, undefined, false);

    try {
        const currentAllotted = getContractorsCurrentAllotted(contractor);
        if (currentAllotted === allottedQty) {
            releaseLock(fileToOperateOn, undefined, false);
            return;
        }
        const configContractorsContent = syncOperationWithErrorHandling(fs.readFileSync, fileToOperateOn, 'utf8');

        const regexString = `(const configContractors = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*[\\r\\n|\\n])([ ]*)(currentAllotted: )(\\d+)(,)`;
        const regexExpression = new RegExp(regexString);
        const newconfigContractorsContent = configContractorsContent.replace(regexExpression, `$1$2$3${allottedQty}$5`);
        if (configContractorsContent === newconfigContractorsContent) {
            lgu(
                `Unable to set contractors: '${contractor}', current allotted quantity to: '${allottedQty}'. Serious issue, please contact developer.`
            );
            releaseLock(fileToOperateOn, undefined, false);
            process.exit(1);
        }
        syncOperationWithErrorHandling(fs.writeFileSync, fileToOperateOn, newconfigContractorsContent, 'utf8');
        // createBackupOfFile(fileToOperateOn, newconfigContractorsContent);
        releaseLock(fileToOperateOn, undefined, false);
    } catch (err) {
        lgc(err);
        process.exit(1);
    }
}

function getContractorsCurrentAllotted(contractor) {
    const configContractorsContent = syncOperationWithErrorHandling(fs.readFileSync, getProjectConfigContractorsFilePath(), 'utf8');
    const regexString = `(const configContractors = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*[\\r\\n|\\n])([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString);

    if (!regexExpression.test(configContractorsContent)) {
        lgu('Unable to match regex for fn getContractorsCurrentAllotted()');
        process.exit(1);
    }

    return configContractorsContent.match(regexExpression)[4];
}

function addToContractorsCurrentAllotted(contractor, quantity) {
    let newQuantity = getContractorsCurrentAllotted(contractor);
    newQuantity = parseInt(newQuantity, 10);
    newQuantity += quantity;
    setContractorsCurrentAllotted(contractor, newQuantity);
}

function getLastLotNumber() {
    const configContent = syncOperationWithErrorHandling(fs.readFileSync, getProjectConfigLotLastFilePath(), 'utf8');
    const lastLotNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',[\\r\\n|\\n])`;
    const lastLotNumberRegexExpression = new RegExp(lastLotNumberRegexString);

    if (!lastLotNumberRegexExpression.test(configContent)) {
        lgu('Unable to match regex for fn getLastLotNumber()');
        process.exit(1);
    }
    return configContent.match(lastLotNumberRegexExpression)[2];
}

function getLastLotDate() {
    const configContent = syncOperationWithErrorHandling(fs.readFileSync, getProjectConfigLotLastFilePath(), 'utf8');
    const lastLotDateRegexString = `(    lotLastRunDate: ')(.*?)(',[\\r\\n|\\n])`;
    const lastLotDateRegexExpression = new RegExp(lastLotDateRegexString);

    if (!lastLotDateRegexExpression.test(configContent)) {
        lgu('Unable to match regex for fn getLastLotDate()');
        process.exit(1);
    }
    return configContent.match(lastLotDateRegexExpression)[2];
}

function setLastLotNumberAndDate(lastLotNumber, lastLotDate) {
    const fileToOperateOn = getProjectConfigLotLastFilePath();
    attainLock(fileToOperateOn, undefined, false);

    try {
        const currentLotLastRunNumber = getLastLotNumber();
        const currentLotLastRunDate = getLastLotDate();
        if (currentLotLastRunNumber === lastLotNumber && currentLotLastRunDate === lastLotDate) {
            releaseLock(fileToOperateOn, undefined, false);
            return;
        }
        let configContent = syncOperationWithErrorHandling(fs.readFileSync, fileToOperateOn, 'utf8');
        let newConfigContent;

        if (currentLotLastRunNumber !== lastLotNumber) {
            const lastRunNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',[\\r\\n|\\n])`;
            const lastRunNumberRegexExpression = new RegExp(lastRunNumberRegexString);
            newConfigContent = configContent.replace(lastRunNumberRegexExpression, `$1${lastLotNumber}$3`);
            if (configContent === newConfigContent) {
                lgu(`Unable to set lastLotNumber: '${lastLotNumber}'. Serious issue, please contact developer.`);
                releaseLock(fileToOperateOn, undefined, false);
                process.exit(1);
            }
            configContent = newConfigContent;
        }

        if (currentLotLastRunDate !== lastLotDate) {
            const lastRunDateRegexString = `(    lotLastRunDate: ')(.*?)(',[\\r\\n|\\n])`;
            const lastRunDateRegexExpression = new RegExp(lastRunDateRegexString);
            newConfigContent = configContent.replace(lastRunDateRegexExpression, `$1${lastLotDate}$3`);
            if (configContent === newConfigContent) {
                lgu(`Unable to set lastLotDate: '${lastLotDate}'. Serious issue, please contact developer.`);
                releaseLock(fileToOperateOn, undefined, false);
                process.exit(1);
            }
        }
        syncOperationWithErrorHandling(fs.writeFileSync, fileToOperateOn, newConfigContent, 'utf8');
        // createBackupOfFile(fileToOperateOn, newConfigContent);
        releaseLock(fileToOperateOn, undefined, false);
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
            if (!syncOperationWithErrorHandling(fs.existsSync, cutterProcessingFolderPath)) {
                makeDir(cutterProcessingFolderPath);
            }
        }
        for (let i = 0; i < cutterRecordKeepingFolders.length; i++) {
            const cutterRecordKeepingFolderPath = `${config.contractorsRecordKeepingPath}\\${contractor}_Acnt\\${cutterRecordKeepingFolders[i]}\\${dateToCreate}`;
            if (!syncOperationWithErrorHandling(fs.existsSync, cutterRecordKeepingFolderPath)) {
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
                if (!syncOperationWithErrorHandling(fs.existsSync, finisherProcessingFolderPath)) {
                    makeDir(finisherProcessingFolderPath);
                }
            }
            for (let i = 0; i < finisherRecordKeepingFolders.length; i++) {
                const finisherRecordKeepingFolderPath = `${config.contractorsRecordKeepingPath}\\${contractor}_Acnt\\${finisherRecordKeepingFolders[i]}\\${dateToCreate}`;
                if (!syncOperationWithErrorHandling(fs.existsSync, finisherRecordKeepingFolderPath)) {
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
            if (!syncOperationWithErrorHandling(fs.existsSync, extraProcessingFolderPath)) {
                makeDir(extraProcessingFolderPath);
            }
        }
    }
}

// eslint-disable-next-line import/prefer-default-export
export {
    setCredentialsKeysValue,
    getLastLotDate,
    getLastLotNumber,
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
