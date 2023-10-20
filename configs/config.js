/**
 * DO NOT EDIT THIS FILE WITHOUT PROPER KNOWLEDGE
 * THIS FILE IS PURELY FOR DEVELOPER PURPOSES ONLY
 *
 * TO EDIT USER FILE, USE 'config-user.js'
 *
 */
import _ from 'lodash';
/* eslint-disable import/extensions */
import { configProduction } from './config-production.js';
import { configDevelopment } from './config-development.js';
import { configUser } from './config-user.js';
/* eslint-enable import/extensions */

const configBasic = {
    environment: 'development', // development Or production
    appDomain: 'https://www.homenetiol.com',
    timezone: 'Asia/Calcutta',
    timeOffsetInMinutesToAvoid: 2,
    browserArgs: {
        headless: false,
        defaultViewport: null,
        protocolTimeout: 0,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data',
            '--hide-crash-restore-bubble',
            '--window-size=1600,860',
            // '--disable-extensions-except=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\faacfelnnfhdicdmkdeclkeanllppdbm\\0.4.6.4_0',
            // '--load-extension=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\faacfelnnfhdicdmkdeclkeanllppdbm\\0.4.6.4_0',
        ],
    },
    // sourceBookmarkPath Or processingBookmarkPathWithoutSync: '/path/to/Chrome/Bookmark' OR '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks'
    /**
     *   Below option to go for direct manipulation in bookmarks
     */
    // sourceBookmarkPath: '.\\datastore\\Bookmarks',
    // processingBookmarkPathWithoutSync: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks',
    /**
     *   Below option is for syncing
     */
    sourceBookmarkPath: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Bookmarks',
    processingBookmarkPathWithoutSync: '.\\datastore\\Bookmarks',
    bookmarkOptions: {
        shouldIncludeFolders: true,
    },
    ignoreBookmarkURLS: [
        {
            URLStartsWith: '',
            ignoreMesgInConsole: '',
            ignoreMesgInBookmark: '',
        },
    ],
    dealerConfigurationFolder: '.\\configs\\DealerConfiguration',
    downloadPath: '.\\datastore\\Downloads',
    contractorsZonePath: '.\\datastore\\ContractorsZone',
    contractorsRecordKeepingPath: '.\\datastore\\ContractorsRecordKeeping',
    uploadingZonePath: '.\\datastore\\UploadingZone',
    finishedUploadingZonePath: '.\\datastore\\FinishedUploadingZone',
    recordKeepingZonePath: '.\\datastore\\RecordKeepingZone',
    lockingBackupsZonePath: '.\\datastore\\LockingBackupsZone',
    reportsPath: '.\\datastore\\Reports',
    automaticClickSaveButtonOnUpload: true,
    cutterProcessingFolders: ['001_CuttingDone'], // The index of this array are used to detect the folder types, so check before you change
    cutterRecordKeepingFolders: ['002_CuttingAccounting'], // The index of this array are used to detect the folder types, so check before you change
    finisherProcessingFolders: ['003_FinishingBuffer', '004_ReadyToUpload'], // The index of this array are used to detect the folder types, so check before you change
    finisherRecordKeepingFolders: ['005_FinishingAccounting'], // The index of this array are used to detect the folder types, so check before you change
    contractors: {
        // ram: {
        //     currentAllotted: 0,
        //     normalThreshold: 500,
        //     extraProcessingFolders: [],
        //     finisher: 'karan',
        // },
        // karan: {
        //     currentAllotted: 0,
        //     normalThreshold: 500,
        //     extraProcessingFolders: [],
        //     finisher: 'karan',
        // },
    },
    lot: [
        // {
        //
        //
        // },
        // {
        //
        //
        // },
    ],
    lotLastRunNumber: '',
    lotLastRunDate: '',
    nonCatchErrorLogLevels9DigitUniqueId: '',
    catchErrorLogLevels6DigitUniqueId: '',
};

/**
 *
 * Check for what environment it is and merge
 * config files accordingly.
 *
 */
let configToExport = '';
if (configUser.environment === 'production' || (configUser.environment === undefined && configBasic.environment === 'production')) {
    configToExport = _.merge(configBasic, configProduction);
    configToExport = _.merge(configToExport, configUser);
} else if (configUser.environment === 'development' || (configUser.environment === undefined && configBasic.environment === 'development')) {
    configToExport = _.merge(configBasic, configDevelopment);
    configToExport = _.merge(configToExport, configUser);
} else {
    configToExport = _.merge(configBasic, configUser);
}

const config = configToExport;

// eslint-disable-next-line import/prefer-default-export
export { config };
