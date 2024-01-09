/**
 * DO NOT EDIT THIS FILE WITHOUT PROPER KNOWLEDGE
 * THIS FILE IS PURELY FOR DEVELOPER PURPOSES ONLY
 *
 * TO EDIT USER FILE, USE 'config-user.js'
 *
 */
const configProduction = {
    browserArgs: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data',
            '--hide-crash-restore-bubble',
            '--window-size=1600,860',
        ],
    },
    sourceBookmarkFilePath: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Bookmarks',

    contractorsZonePath: 'C:\\Users\\Administrator\\Dropbox\\contractorsZone',
    contractorsRecordKeepingPath: 'C:\\Users\\Administrator\\Dropbox\\contractorsRecordKeeping',

    reportsJSONPath: '..\\autodown_datastore\\Reports\\jsondata',
    reportsExcelOutputPath: '..\\autodown_datastore\\Reports\\generated',
    reportsMergedCopyPath: 'C:\\Users\\Administrator\\Dropbox\\MergedReports',

    finishedUploadingZonePath: '..\\autodown_datastore\\FinishedUploadingZone',
    recordKeepingZonePath: '..\\autodown_datastore\\RecordKeepingZone',

    sendLogToNtfyUptoDate: '2024-07-01',
    updateBookmarksOnceDone: true,
    automaticClickSaveButtonOnUpload: true,

    credentials: [
        {
            username: 'cute996@gmail.com',
            password: 'hello*123',
            credentialsblockSHA1: '',
        },
        {
            username: 'vambackground',
            password: 'hello*123',
            credentialsblockSHA1: '',
        },
    ],
};

// eslint-disable-next-line import/prefer-default-export
export { configProduction };
