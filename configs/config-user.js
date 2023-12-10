// Configuration in this file will override all settings in other config files
const configUser = {
    // environment: 'production', // development Or production
    // timezone: 'Asia/Calcutta',
    // appDomain: 'https://www.homenetiol.com',
    // timeOffsetInMinutesToAvoid: 2,
    // browserArgs: { headless: false },
    // sourceBookmarkPath: '.\\datastore\\Bookmarks',
    // processingBookmarkPathWithoutSync: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks',
    // updateBookmarksOnceDone: true,
    loggingLevel: 'trace',
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
        /connect ETIMEDOUT .*/g,
        'socket hang up',
        'aborted',
        'read ECONNRESET',
        'Page.navigate timed out.',
    ],
    // dealerConfigurationFolder: '.\\configs\\DealerConfiguration',
    // downloadPath: '.\\datastore\\Downloads',
    // contractorsZonePath: '.\\datastore\\ContractorsZone',
    // contractorsRecordKeepingPath: '.\\datastore\\ContractorsRecordKeeping',
    // uploadingZonePath: '.\\datastore\\UploadingZone',
    // finishedUploadingZonePath: '.\\datastore\\FinishedUploadingZone',
    // recordKeepingZonePath: '.\\datastore\\RecordKeepingZone',
    // lockingBackupsZonePath: '.\\datastore\\LockingBackupsZone',
    // reportsPath: '.\\datastore\\Reports',
    automaticClickSaveButtonOnUpload: true,
    credentials: [
        {
            username: 'dinesharora80@gmail.com',
            password: 'kunsh123',
            credentialsblockSHA1: '',
        },
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
export { configUser };
