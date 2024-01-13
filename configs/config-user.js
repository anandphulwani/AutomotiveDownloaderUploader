// Configuration in this file will override all settings in other config files
const configUser = {
    // environment: 'production', // development Or production
    // timezone: 'Asia/Calcutta',
    // timeOffsetInMinutesToAvoid: 2,
    // appDomain: 'https://www.homenetiol.com',
    // allottedFolderRegex: '^(\\d[\\S]*)(?: ([\\S| ]*))? ([\\S]+) (\\d{1,3}) \\((#(\\d{5}))\\)$',
    loggingFileLevel: 'trace',
    loggingConsoleLevel: 'trace',
    // sendLogToNtfyUptoDate: '2024-07-01',
    // browserArgs: {
    //     headless: false,
    //     defaultViewport: null,
    //     protocolTimeout: 0,
    //     executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    //     args: [
    //         '--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data',
    //         '--hide-crash-restore-bubble',
    //         '--window-size=1600,860',
    //     ],
    // },
    // sourceBookmarksFilePath: '..\\autodown_datastore\\Bookmarks_Source',
    // processingBookmarksWithoutSyncFilePath: '..\\autodown_datastore\\Bookmarks',
    // bookmarkOptions: {
    //     shouldIncludeFolders: true,
    // },
    ignoreBookmarkURLS: [
        {
            URLStartsWith: '{config.appDomain}/inventory/photo-manager?',
            ignoreMesgInConsole: 'Photo Manager URL ...... (Ignoring)',
            ignoreMesgInBookmark: 'Ignoring (Photo-Manager)',
        },
        {
            URLStartsWith: '{config.appDomain}/reporting/photo-upload?',
            ignoreMesgInConsole: 'Photo Upload URL ...... (Ignoring)',
            ignoreMesgInBookmark: 'Ignoring (Photo-Upload)',
        },
        {
            URLStartsWith: '{config.appDomain}/inventory/browse-vehicles/list?',
            ignoreMesgInConsole: 'Browse Vehicles List URL ...... (Ignoring)',
            ignoreMesgInBookmark: 'Ignoring (Browse-Vehicles-List)',
        },
        {
            URLStartsWith: '{config.appDomain}/inventory/browse-vehicles/details?',
            ignoreMesgInConsole: 'Browse Vehicles Details URL ...... (Ignoring)',
            ignoreMesgInBookmark: 'Ignoring (Browse-Vehicles-Details)',
        },
    ],
    urlCrawlingErrorsEligibleForRetrying: [
        /Navigation timeout of \d* ms exceeded/g,
        /net::ERR_CONNECTION_TIMED_OUT at .*/g,
        /net::ERR_NAME_NOT_RESOLVED at .*/g,
        /net::ERR_CONNECTION_CLOSED at .*/g,
        /net::ERR_ABORTED at .*/g,
        /net::ERR_NETWORK_CHANGED at .*/g,
        /getaddrinfo ENOTFOUND .*/g,
        /connect ETIMEDOUT .*/g,
        'socket hang up',
        'aborted',
        'read ECONNRESET',
        'Page.navigate timed out.',
    ],
    browserClosingErrors: [
        'Navigation failed because browser has disconnected!',
        'Protocol error (Page.navigate): Session closed. Most likely the page has been closed.',
        'Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.',
        'Protocol error (Runtime.callFunctionOn): Target closed',
        'Execution context was destroyed, most likely because of a navigation.',
    ],
    // dealerConfigurationPath: '.\\configs\\DealerConfiguration',
    // downloadPath: '..\\autodown_datastore\\Downloads',
    // contractorsZonePath: '..\\autodown_datastore\\ContractorsZone',
    // contractorsRecordKeepingPath: '..\\autodown_datastore\\ContractorsRecordKeeping',
    // uploadingZonePath: '..\\autodown_datastore\\UploadingZone',
    // finishedUploadingZonePath: '..\\autodown_datastore\\FinishedUploadingZone',
    // finishedAllotmentZonePath: '..\\autodown_datastore\\FinishedAllotmentZone',
    // lockingBackupsZonePath: '..\\autodown_datastore\\LockingBackupsZone',
    // reportsJSONPath: '..\\autodown_datastore\\Reports\\jsondata',
    // reportsExcelOutputPath: '..\\autodown_datastore\\Reports\\generated',
    // reportsMergedCopyPath: '..\\autodown_datastore\\Reports\\mergedcopy',
    // isUpdateBookmarksOnceDone: false,
    // isAutomaticClickSaveButtonOnUpload: false,
    // cutterProcessingFolders: ['001_CuttingDone'], // The index of this array are used to detect the folder types, so check before you change
    // cutterRecordKeepingFolders: ['002_CuttingAccounting'], // The index of this array are used to detect the folder types, so check before you change
    // finisherProcessingFolders: ['003_FinishingBuffer', '004_ReadyToUpload'], // The index of this array are used to detect the folder types, so check before you change
    // finisherRecordKeepingFolders: ['005_FinishingAccounting'], // The index of this array are used to detect the folder types, so check before you change
};

// eslint-disable-next-line import/prefer-default-export
export { configUser };
