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
    sourceBookmarksFilePath: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Bookmarks',

    contractorsZonePath: 'C:\\Users\\Administrator\\Dropbox\\contractorsZone',
    contractorsRecordKeepingPath: 'C:\\Users\\Administrator\\Dropbox\\contractorsRecordKeeping',

    reportsJSONPath: '..\\autodown_datastore\\Reports\\jsondata',
    reportsExcelOutputPath: '..\\autodown_datastore\\Reports\\generated',
    reportsMergedCopyPath: 'C:\\Users\\Administrator\\Dropbox\\MergedReports',

    doneUploadingZonePath: '..\\autodown_datastore\\DoneUploadingZone',
    doneAllotmentZonePath: '..\\autodown_datastore\\DoneAllotmentZone',

    sendLogToNtfyUptoDate: '2024-07-01',
    isUpdateBookmarksOnceDone: true,
    isAutomaticClickSaveButtonOnUpload: true,

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
