import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import { isValid, parse } from 'date-fns';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { getAllDealerNumbers } from './excelsupportive.js';
import { lgd, lge } from './loggerandlocksupportive.js';
import { makeDir } from './filesystem.js';
import { levels } from './logger.js';
/* eslint-enable import/extensions */

const currentConfigParams = [
    'environment',
    'timezone',
    'timeOffsetInMinutesToAvoid',
    'appDomain',
    'allottedFolderRegex',
    'loggingFileLevel',
    'loggingConsoleLevel',
    'sendLogToNtfyUptoDate',
    'browserArgs',
    'sourceBookmarkFilePath',
    'processingBookmarkWithoutSyncFilePath',
    'bookmarkOptions',
    'ignoreBookmarkURLS',
    'urlCrawlingErrorsEligibleForRetrying',
    'browserClosingErrors',
    'dealerConfigurationPath',
    'downloadPath',
    'contractorsZonePath',
    'contractorsRecordKeepingPath',
    'uploadingZonePath',
    'finishedUploadingZonePath',
    'finishedAllotmentZonePath',
    'lockingBackupsZonePath',
    'reportsJSONPath',
    'reportsExcelOutputPath',
    'reportsMergedCopyPath',
    'isUpdateBookmarksOnceDone',
    'isAutomaticClickSaveButtonOnUpload',
    'cutterProcessingFolders',
    'cutterRecordKeepingFolders',
    'finisherProcessingFolders',
    'finisherRecordKeepingFolders',
    'credentials',
    'nonCatchErrorLogLevels9DigitUniqueId',
    'catchErrorLogLevels6DigitUniqueId',
    'lotLastRunNumber',
    'lotLastRunDate',
    'lot',
    'contractors',
];

function filterByCondition(obj, conditionFunction) {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => conditionFunction(key)));
}

function removeKeyValuePairsFromObject(obj, keysArr) {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keysArr.includes(key)));
}

function splitObjIntoTwoByCondition(configObj, conditionFunction) {
    const filteredConfigByKeysTypeObj = filterByCondition(configObj, conditionFunction);
    const filteredConfigReamining = removeKeyValuePairsFromObject(configObj, Object.keys(filteredConfigByKeysTypeObj));
    return { filteredConfigByKeysTypeObj, filteredConfigReamining };
}

function validateConfigFile(debug = false) {
    debug ? lgd(`Validating config file: Executing.`) : null;
    let validationStatus = 'success';

    /**
     * Check normal, type validations
     */

    /* #region Check all config parameters exists, no more and no less. */
    const configKeys = Object.keys(config);
    const missingConfigKeys = currentConfigParams.filter((key) => !configKeys.includes(key));
    const additionalConfigKeys = configKeys.filter((key) => !currentConfigParams.includes(key));

    if (missingConfigKeys.length > 0) {
        lge(`Config's missing parameters: '${missingConfigKeys.join(', ')}', please define them.`);
        validationStatus = 'error';
    }
    if (additionalConfigKeys.length > 0) {
        lge(`Config's additional parameters: '${additionalConfigKeys.join(', ')}', please remove them.`);
        validationStatus = 'error';
    }
    /* #endregion */

    let filteredConfigByKeysTypeObj;
    let filteredConfigReamining = config;

    /* #region Config's 'nonCatchErrorLogLevels9DigitUniqueId' and 'catchErrorLogLevels6DigitUniqueId' handling */
    /**
     * Config's 'nonCatchErrorLogLevels9DigitUniqueId' and 'catchErrorLogLevels6DigitUniqueId' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key === 'nonCatchErrorLogLevels9DigitUniqueId' || key === 'catchErrorLogLevels6DigitUniqueId'
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (configsValue !== '' && Number.isNaN(Number(configsValue))) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) is not a number, inside string literal i.e. ' and '.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's 'lotLastRunNumber' and 'lotLastRunDate' handling */
    /**
     * Config's 'lotLastRunNumber' and 'lotLastRunDate' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key === 'lotLastRunNumber' || key === 'lotLastRunDate'
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (configsKey === 'lotLastRunNumber' && configsValue !== '') {
            if (
                configsValue.length !== 6 ||
                !configsValue.startsWith('Lot_') ||
                Number.isNaN(Number(configsValue.substring(configsValue.length - 2)))
            ) {
                lge(
                    `Config's '${configsKey}': Invalid value (${configsValue}) which is not a valid value which should start with 'Lot_' and end with two digit number.`
                );
                validationStatus = 'error';
            }
        } else if (configsKey === 'lotLastRunDate' && configsValue !== '') {
            if (configsValue.length !== 10 || !isValid(parse(configsValue, 'yyyy-MM-dd', new Date()))) {
                lge(
                    `Config's '${configsKey}': Invalid value (${configsValue}) which is not a valid value which should be date in 'YYYY-MM-DD' format.`
                );
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's key 'environment' handling */
    /**
     * Config's key 'environment' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'environment'));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (configsValue !== 'production' && configsValue !== 'development') {
            lge(
                `Config's '${configsKey}': Invalid value (${configsValue}) which is not a valid value, valid value can be either 'production' or 'development'.`
            );
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's key 'timezone' handling */
    /**
     * Config's key 'timezone' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'timezone'));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (moment.tz.zone(configsValue) === null) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not a valid value for timezone.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's key 'timeOffsetInMinutesToAvoid' handling */
    /**
     * Config's key 'timeOffsetInMinutesToAvoid' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key === 'timeOffsetInMinutesToAvoid'
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'number') {
            lge(
                `Config's '${configsKey}': Invalid value (${configsValue}) which should be number and should not be enclosed in string literal i.e ' and '.`
            );
            validationStatus = 'error';
        } else if (!configsValue > 0) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which should be valid numeric value greater than 0.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's key 'appDomain' handling */
    /**
     * Config's key 'appDomain' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'appDomain'));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (!configsValue.startsWith('https://') && !configsValue.startsWith('http://')) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which should be a domain starting with 'https://' or 'http://'.`);
            validationStatus = 'error';
        } else if (configsValue.endsWith('/')) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which should be a domain and not ending with '/'.`);
            validationStatus = 'error';
        } else {
            try {
                // eslint-disable-next-line no-new
                new URL(configsValue);
            } catch (error) {
                lge(`Config's '${configsKey}': Invalid value (${configsValue}) which should be a proper domain name.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's key 'browserArgs' handling */
    /**
     * Config's key 'browserArgs' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'browserArgs'));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        if (!(typeof configsValue === 'object' && configsValue !== null && !Array.isArray(configsValue))) {
            lge(`Config's '${configsKey}': It should be only an object, i.e. values should be inside '{' and '}'.`);
            validationStatus = 'error';
        }
        const keys = Object.keys(configsValue);
        const requiredKeys = ['headless', 'defaultViewport', 'protocolTimeout', 'executablePath', 'args'];
        const missingKeys = requiredKeys.filter((key) => !keys.includes(key));
        const additionalKeys = keys.filter((key) => !requiredKeys.includes(key));

        if (missingKeys.length > 0) {
            lge(`Config's '${configsKey}': Missing parameters '${missingKeys.join(', ')}', Please define them.`);
            validationStatus = 'error';
        }
        if (additionalKeys.length > 0) {
            lge(`Config's '${configsKey}': Additional parameters '${additionalKeys.join(', ')}', Please remove them.`);
            validationStatus = 'error';
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const [configsSubKey, configsSubValue] of Object.entries(configsValue)) {
            if (configsSubKey === 'headless' && typeof configsSubValue !== 'boolean') {
                // For 'headless' validation
                lge(`Config's '${configsKey}': '${configsSubKey}': Invalid value (${configsSubValue}) which should be either true or false.`);
                validationStatus = 'error';
            } else if (configsSubKey === 'defaultViewport' && configsSubValue !== null) {
                // For 'defaultViewport' validation
                lge(`Config's '${configsKey}': '${configsSubKey}': Invalid value (${configsSubValue}) which should be null.`);
                validationStatus = 'error';
            } else if (configsSubKey === 'protocolTimeout' && typeof configsSubValue !== 'number') {
                // For 'protocolTimeout' validation
                lge(
                    `Config's '${configsKey}': '${configsSubKey}': Invalid value (${configsSubValue}) which should be number and should not be enclosed in string literal i.e ' and '.`
                );
                validationStatus = 'error';
            } else if (configsSubKey === 'protocolTimeout' && !(configsSubValue >= 0)) {
                // For 'protocolTimeout' validation
                lge(
                    `Config's '${configsKey}': '${configsSubKey}': Invalid value (${configsSubValue}) which should be valid numeric value equal or greater than 0.`
                );
                validationStatus = 'error';
            } else if (configsSubKey === 'executablePath' && typeof configsSubValue !== 'string') {
                // For 'executablePath' validation
                lge(
                    `Config's '${configsKey}': '${configsSubKey}': Invalid value (${configsSubValue}) which is not enclosed in string literal i.e ' and '.`
                );
                validationStatus = 'error';
            } else if (configsSubKey === 'executablePath' && !fs.existsSync(configsSubValue)) {
                // For 'executablePath' validation
                lge(`Config's '${configsKey}': '${configsSubKey}': File '${configsSubValue}' does not exist.`);
                validationStatus = 'error';
            } else if (configsSubKey === 'args') {
                // For 'args' validation
                if (!Array.isArray(configsSubValue)) {
                    lge(`Config's '${configsKey}': '${configsSubKey}': Value is not an array, the value should be inside '[' and ']'.`);
                    validationStatus = 'error';
                } else {
                    // Check if the array is an array of string
                    const nonStringItems = configsSubValue.filter((item) => typeof item !== 'string');
                    if (nonStringItems.length > 0) {
                        const nonStringItemsStr = nonStringItems.join(', ');
                        lge(`Config's '${configsKey}': '${configsSubKey}': Invalid value (${nonStringItemsStr}) which is not string.`);
                        validationStatus = 'error';
                    } else {
                        // Check if the array is an array of string starting with '--'
                        const nonDoubleDashItems = configsSubValue.filter((item) => !item.startsWith('--'));
                        if (nonDoubleDashItems.length > 0) {
                            const nonDoubleDashItemsStr = nonDoubleDashItems.join(', ');
                            lge(
                                `Config's '${configsKey}': '${configsSubKey}': Invalid value (${nonDoubleDashItemsStr}) which doesnt start with '--'.`
                            );
                            validationStatus = 'error';
                        } else {
                            // Check for --user-data-dir and its validity
                            const userDataDirArg = configsSubValue.find((arg) => arg.startsWith('--user-data-dir='));
                            if (!userDataDirArg) {
                                lge(`Config's '${configsKey}': '${configsSubKey}': Value starting with '--user-data-dir=' is not found.`);
                                validationStatus = 'error';
                            } else {
                                const userDataDir = userDataDirArg.split('=')[1];
                                if (!fs.existsSync(userDataDir)) {
                                    lge(`Config's '${configsKey}': '${configsSubKey}': '--user-data-dir=' Path does not exist.`);
                                    validationStatus = 'error';
                                } else if (!fs.statSync(userDataDir).isDirectory()) {
                                    lge(`Config's '${configsKey}': '${configsSubKey}': '--user-data-dir=' Path exists, but is not a directory.`);
                                    validationStatus = 'error';
                                }
                            }
                            // Validate --window-size if present
                            const windowSizeArg = configsSubValue.find((arg) => arg.startsWith('--window-size='));
                            if (windowSizeArg) {
                                const sizes = windowSizeArg.split('=')[1].split(',');
                                if (sizes.length !== 2 || Number.isNaN(sizes[0]) || Number.isNaN(sizes[1]) || sizes[0] <= 0 || sizes[1] <= 0) {
                                    lge(
                                        `Config's '${configsKey}': '${configsSubKey}': '--window-size=' values should be in format '--window-size=X,Y' where X and Y both are number and greater than 0.`
                                    );
                                    validationStatus = 'error';
                                }
                            }
                        }
                        const validArgs = ['--user-data-dir=', '--hide-crash-restore-bubble', '--window-size='];
                        const invalidArgs = configsSubValue.filter((arg) => !validArgs.some((validArg) => arg.startsWith(validArg)));
                        if (invalidArgs.length > 0) {
                            lge(
                                `Config's '${configsKey}': '${configsSubKey}': Additional parameters '${invalidArgs.join(', ')}', Please remove them.`
                            );
                            validationStatus = 'error';
                        }
                    }
                }
            }
        }
    }
    /* #endregion */

    /* #region Config's key 'bookmarkOptions' handling */
    /**
     * Config's key 'bookmarkOptions' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key === 'bookmarkOptions'
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        if (!(typeof configsValue === 'object' && configsValue !== null && !Array.isArray(configsValue))) {
            lge(`Config's '${configsKey}': It should be only an object, i.e. values should be inside '{' and '}'.`);
            validationStatus = 'error';
        }
        const keys = Object.keys(configsValue);
        const requiredKeys = ['shouldIncludeFolders'];
        const missingKeys = requiredKeys.filter((key) => !keys.includes(key));
        const additionalKeys = keys.filter((key) => !requiredKeys.includes(key));

        if (missingKeys.length > 0) {
            lge(`Config's '${configsKey}': Missing parameters '${missingKeys.join(', ')}', Please define them.`);
            validationStatus = 'error';
        }
        if (additionalKeys.length > 0) {
            lge(`Config's '${configsKey}': Additional parameters '${additionalKeys.join(', ')}', Please remove them.`);
            validationStatus = 'error';
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const [configsSubKey, configsSubValue] of Object.entries(configsValue)) {
            if (configsSubKey === 'shouldIncludeFolders' && typeof configsSubValue !== 'boolean') {
                // For 'shouldIncludeFolders' validation
                lge(`Config's '${configsKey}': '${configsSubKey}': Invalid value (${configsSubValue}) which should be either true or false.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's keys which end with 'Date' handling */
    /**
     * Config's keys which end with 'Date' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key.endsWith('Date')));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (configsValue.length !== 10 || !isValid(parse(configsValue, 'yyyy-MM-dd', new Date()))) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not a valid value which should be date in 'YYYY-MM-DD' format.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's keys which start with 'is' handling */
    /**
     * Config's keys which start with 'is' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key.startsWith('is')));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'boolean') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which should be either true or false.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's keys which start with 'logging', end with 'Level' handling */
    /**
     * Config's keys which start with 'logging', end with 'Level' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key.startsWith('logging') && key.endsWith('Level')
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else if (!Object.keys(levels).includes(configsValue)) {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not one of the logging levels defined in the system.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's keys which end with 'Regex' handling */
    /**
     * Config's keys which end with 'Regex' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key.endsWith('Regex')));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if its string
        if (typeof configsValue !== 'string') {
            lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not enclosed in string literal i.e ' and '.`);
            validationStatus = 'error';
        } else {
            try {
                // eslint-disable-next-line no-new
                new RegExp(configsValue);
            } catch (error) {
                lge(`Config's '${configsKey}': Invalid value (${configsValue}) which is not a valid regex.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's 'credentials' handling */
    /**
     * Config's 'credentials' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'credentials'));
    if (filteredConfigByKeysTypeObj && 'credentials' in filteredConfigByKeysTypeObj) {
        const configsCredentials = filteredConfigByKeysTypeObj.credentials;
        // Check if credentials is an array
        if (!Array.isArray(configsCredentials)) {
            lge(`Config's 'credentials': Value is not an array, the value should be inside '[' and ']'.`);
            validationStatus = 'error';
        }

        // Check if the array is an array of objects
        if (!configsCredentials.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
            lge(
                `Config's 'credentials': Single credentials value inside the 'credentials' array should contain only objects, i.e. values should be inside '{' and '}'.`
            );
            validationStatus = 'error';
        }

        const requiredKeys = ['username', 'password', 'credentialsblockSHA1'];
        // Check for specific keys and their valid values
        for (let i = 0; i < configsCredentials.length; i++) {
            const item = configsCredentials[i];
            const keys = Object.keys(item);

            const missingKeys = requiredKeys.filter((key) => !keys.includes(key));
            const additionalKeys = keys.filter((key) => !requiredKeys.includes(key));

            if (missingKeys.length > 0) {
                lge(`Config's 'credentials': ${i} block: Missing parameters '${missingKeys.join(', ')}', Please define them.`);
                validationStatus = 'error';
            }
            if (additionalKeys.length > 0) {
                lge(`Config's 'credentials': ${i} block: Additional parameters '${additionalKeys.join(', ')}', Please remove them.`);
                validationStatus = 'error';
            }

            const invalidValueKeys = requiredKeys.filter((key) => item[key] !== undefined && typeof item[key] !== 'string');
            for (let k = 0; k < invalidValueKeys.length; k++) {
                const invalidValueKey = invalidValueKeys[k];
                lge(`Config's 'credentials': ${i} block: '${invalidValueKey}': Invalid value (${item[invalidValueKey]}) which is not string.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's 'ignoreBookmarkURLS' handling */
    /**
     * Config's 'ignoreBookmarkURLS' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key === 'ignoreBookmarkURLS'
    ));
    if (filteredConfigByKeysTypeObj && 'ignoreBookmarkURLS' in filteredConfigByKeysTypeObj) {
        const configsIgnoreBookmarkURLS = filteredConfigByKeysTypeObj.ignoreBookmarkURLS;
        // Check if ignoreBookmarkURLS is an array
        if (!Array.isArray(configsIgnoreBookmarkURLS)) {
            lge(`Config's 'ignoreBookmarkURLS': Value is not an array, the value should be inside '[' and ']'.`);
            validationStatus = 'error';
        }

        // Check if the array is an array of objects
        if (!configsIgnoreBookmarkURLS.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
            lge(
                `Config's 'ignoreBookmarkURLS': Single ignoreBookmarkURLS value inside the 'ignoreBookmarkURLS' array should contain only objects, i.e. values should be inside '{' and '}'.`
            );
            validationStatus = 'error';
        }

        const requiredKeys = ['URLStartsWith', 'ignoreMesgInConsole', 'ignoreMesgInBookmark'];
        // Check for specific keys and their valid values
        for (let i = 0; i < configsIgnoreBookmarkURLS.length; i++) {
            const item = configsIgnoreBookmarkURLS[i];
            const keys = Object.keys(item);

            const missingKeys = requiredKeys.filter((key) => !keys.includes(key));
            const additionalKeys = keys.filter((key) => !requiredKeys.includes(key));

            if (missingKeys.length > 0) {
                lge(`Config's 'ignoreBookmarkURLS': ${i} block: Missing parameters '${missingKeys.join(', ')}', Please define them.`);
                validationStatus = 'error';
            }
            if (additionalKeys.length > 0) {
                lge(`Config's 'ignoreBookmarkURLS': ${i} block: Additional parameters '${additionalKeys.join(', ')}', Please remove them.`);
                validationStatus = 'error';
            }

            const invalidValueKeys = requiredKeys.filter((key) => item[key] !== undefined && typeof item[key] !== 'string');
            for (let k = 0; k < invalidValueKeys.length; k++) {
                const invalidValueKey = invalidValueKeys[k];
                lge(`Config's 'ignoreBookmarkURLS': ${i} block: '${invalidValueKey}': Invalid value (${item[invalidValueKey]}) which is not string.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's 'urlCrawlingErrorsEligibleForRetrying' and 'browserClosingErrors' handling */
    /**
     * Config's 'urlCrawlingErrorsEligibleForRetrying' and 'browserClosingErrors' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(
        filteredConfigReamining,
        (key) => key === 'urlCrawlingErrorsEligibleForRetrying' || key === 'browserClosingErrors'
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [configsKey, configsValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if urlCrawlingErrorsEligibleForRetrying, browserClosingErrors is an array
        if (!Array.isArray(configsValue)) {
            lge(`Config's '${configsKey}': Value is not an array, the value should be inside '[' and ']'.`);
            validationStatus = 'error';
        } else {
            // Check if the array is an array of string or regex
            const nonStringOrRegexItems = configsValue.filter((item) => typeof item !== 'string' && !(item instanceof RegExp));
            if (nonStringOrRegexItems.length > 0) {
                const nonStringOrRegexItemsStr = nonStringOrRegexItems.join(', ');
                lge(`Config's '${configsKey}': Invalid value (${nonStringOrRegexItemsStr}) which is not string or a regex.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's keys which end with 'FilePath' handling */
    /**
     * Config's keys which end with 'FilePath' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) =>
        key.endsWith('FilePath')
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [filePathKey, filePathValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        if (typeof filePathValue !== 'string') {
            lge(`Config's '${filePathKey}': Invalid value (${filePathValue}) which is not string.`);
            validationStatus = 'error';
        } else if (!fs.existsSync(filePathValue)) {
            lge(`Config's '${filePathKey}': File '${filePathValue}' does not exist.`);
            validationStatus = 'error';
        }
    }
    /* #endregion */

    /* #region Config's keys which end with 'Path' handling */
    /**
     * Config's keys which end with 'Path' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key.endsWith('Path')));
    // eslint-disable-next-line no-restricted-syntax
    for (const [pathKey, pathValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        if (typeof pathValue !== 'string') {
            lge(`Config's '${pathKey}': Invalid value (${pathValue}) which is not string.`);
            validationStatus = 'error';
        } else if (!fs.existsSync(pathValue)) {
            try {
                makeDir(pathValue, true);
            } catch (err) {
                /**
                 * Do Nothing
                 */
            }
            if (!fs.existsSync(pathValue)) {
                lge(`Config's '${pathKey}': Folder '${pathValue}' does not exist, Unable to create it programmatically.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config's keys which end with 'Folders' handling */
    /**
     * Config's keys which end with 'Folders' handling
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) =>
        key.endsWith('Folders')
    ));
    // eslint-disable-next-line no-restricted-syntax
    for (const [folderKey, folderValue] of Object.entries(filteredConfigByKeysTypeObj)) {
        // Check if values is an array
        if (!Array.isArray(folderValue)) {
            lge(`Config's '${folderKey}': Value is not an array, the value should be inside '[' and ']'.`);
            validationStatus = 'error';
        } else {
            const nonStringItems = folderValue.filter((item) => typeof item !== 'string');
            if (nonStringItems.length > 0) {
                lge(`Config's '${folderKey}': Invalid value (${nonStringItems.join(', ')}) which is not string.`);
                validationStatus = 'error';
            }
        }
    }
    /* #endregion */

    /* #region Config: lot */
    /**
     * Config: lot
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'lot'));
    if (filteredConfigByKeysTypeObj && 'lot' in filteredConfigByKeysTypeObj) {
        const configsLot = filteredConfigByKeysTypeObj.lot;
        // Check if lot is an array
        if (!Array.isArray(configsLot)) {
            lge(`Config's 'lot': Value is not an array, the value should be inside '[' and ']'.`);
            validationStatus = 'error';
        }

        // Check if the array is an array of objects
        if (!configsLot.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
            lge(`Config's 'lot': Single lot value inside the 'lot' array should contain only objects, i.e. values should be inside '{' and '}'.`);
            validationStatus = 'error';
        }

        // Check for specific keys and their valid values
        for (let i = 0; i < configsLot.length; i++) {
            const item = configsLot[i];
            const keys = Object.keys(item);
            if (keys.length === 0) {
                lge(`Config's 'lot' (${i}): Empty block found.`);
                validationStatus = 'error';
            }
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];

                if (key !== 'minimumDealerFoldersForEachContractors' && key !== 'imagesQty') {
                    lge(`Config's 'lot' (${i}): Invalid key '${key}' found.`);
                    validationStatus = 'error';
                }

                if (key === 'minimumDealerFoldersForEachContractors') {
                    const value = item[key];
                    if (value !== false && (typeof value !== 'number' || value < 1)) {
                        lge(`Config's 'lot' (${i}): Invalid value (${value}) for 'minimumDealerFoldersForEachContractors'.`);
                        validationStatus = 'error';
                    }
                }

                if (key === 'imagesQty') {
                    const value = item[key];
                    if (typeof value !== 'number' || value < 0) {
                        lge(`Config's 'lot' (${i}): Invalid value (${value}) for 'imagesQty'.`);
                        validationStatus = 'error';
                    }
                }
            }
        }
    }
    /* #endregion */

    /* #region Config: contractors */
    /**
     * Config: contractors
     */
    ({ filteredConfigByKeysTypeObj, filteredConfigReamining } = splitObjIntoTwoByCondition(filteredConfigReamining, (key) => key === 'contractors'));
    if (filteredConfigByKeysTypeObj && 'contractors' in filteredConfigByKeysTypeObj) {
        const configsContractors = filteredConfigByKeysTypeObj.contractors;
        // Check if contractors is an object
        if (typeof configsContractors !== 'object' || configsContractors === null || Array.isArray(configsContractors)) {
            lge(`Config's 'contractors': Value is not an object, the value should be inside '{' and '}'.`);
            validationStatus = 'error';
        } else {
            const contractorNames = Object.keys(configsContractors);

            // eslint-disable-next-line no-restricted-syntax
            for (const [name, details] of Object.entries(configsContractors)) {
                if (typeof name !== 'string') {
                    lge(`Config's 'contractors' name: '${name}' is not a string.`);
                    validationStatus = 'error';
                }

                const requiredKeys = ['currentAllotted', 'normalThreshold', 'finisher'];
                // eslint-disable-next-line no-restricted-syntax
                for (const key of requiredKeys) {
                    if (!(key in details)) {
                        lge(`Config's 'contractors' name '${name}': Missing '${key}' in contractor block.`);
                    }
                }

                const allowedKeys = [...requiredKeys, 'extraProcessingFolders'];
                const invalidKeys = Object.keys(details).filter((key) => !allowedKeys.includes(key));
                if (invalidKeys.length > 0) {
                    lge(`Config's 'contractors' name '${name}': Unexpected keys found in contractor block: ${invalidKeys.join(', ')}`);
                    validationStatus = 'error';
                }

                // Check currentAllotted
                if (typeof details.currentAllotted !== 'number' || details.currentAllotted < 0) {
                    lge(`Config's 'contractors' name '${name}': Invalid 'currentAllotted' (${details.currentAllotted}) value.`);
                    validationStatus = 'error';
                }

                // Check normalThreshold
                if (typeof details.normalThreshold !== 'number' || details.normalThreshold < -1) {
                    lge(`Config's 'contractors' name '${name}': Invalid 'normalThreshold' (${details.normalThreshold}) value.`);
                    validationStatus = 'error';
                }

                // Check extraProcessingFolders
                if ('extraProcessingFolders' in details) {
                    if (!Array.isArray(details.extraProcessingFolders)) {
                        lge(`Config's 'contractors' name '${name}': Value of 'extraProcessingFolders' is not an array.`);
                        validationStatus = 'error';
                    } else {
                        const nonStringItems = details.extraProcessingFolders.filter((item) => typeof item !== 'string');
                        if (nonStringItems.length > 0) {
                            lge(`Config's 'contractors' name '${name}': Invalid 'extraProcessingFolders' (${nonStringItems.join(', ')}) value.`);
                            validationStatus = 'error';
                        }
                    }
                }

                // Check finisher
                if (typeof details.finisher !== 'string' || !contractorNames.includes(details.finisher)) {
                    lge(
                        `Config's 'contractors' name '${name}': Invalid 'finisher' (${details.finisher}) value, probably invalid type of value or finisher does not exist.`
                    );
                    validationStatus = 'error';
                }
            }
        }
    }
    /* #endregion */

    /**
     * Check specific validations
     */

    debug
        ? lgd(`Making sure that 'config.sourceBookmarkFilePath' and 'config.processingBookmarkWithoutSyncFilePath' are not same file: Executing.`)
        : null;
    const { sourceBookmarkFilePath, processingBookmarkWithoutSyncFilePath } = config;
    if (path.resolve(sourceBookmarkFilePath) === path.resolve(processingBookmarkWithoutSyncFilePath)) {
        validationStatus = 'error';
        lge(`Config's 'sourceBookmarkFilePath' and Config's 'processingBookmarkWithoutSyncFilePath' are reflecting the same file.`);
        return validationStatus;
    }
    debug
        ? lgd(`Making sure that 'config.sourceBookmarkFilePath' and 'config.processingBookmarkWithoutSyncFilePath' are not same file: Done.`)
        : null;

    debug ? lgd(`Validating config file: Done.`) : null;
    return validationStatus;
}

// eslint-disable-next-line import/prefer-default-export
export { validateConfigFile };
