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
    /**
     * Setting normalThreshold to `0`, will take the contractor in account for minimumDealerFoldersForEachContractors
     * Setting normalThreshold to `-1`, will take the contractor out of calculation totally for minimumDealerFoldersForEachContractors and imagesQty
     */
    contractors: {
        biswas: {
            currentAllotted: 64,
            normalThreshold: 550,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        saikat: {
            currentAllotted: 5,
            normalThreshold: 300,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        sachin: {
            currentAllotted: 54,
            normalThreshold: 525,
            extraProcessingFolders: [],
            finisher: 'sachin',
        },
        shivani: {
            currentAllotted: 17,
            normalThreshold: 350,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        rakesh: {
            currentAllotted: 4,
            normalThreshold: 250,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        poonam: {
            currentAllotted: 4,
            normalThreshold: 150,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        kalpana: {
            currentAllotted: 1,
            normalThreshold: 125,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        // bhavna: {
        //    currentAllotted: 0,
        //    normalThreshold: 70,
        //    extraProcessingFolders: [],
        //    finisher: 'karan',
        //   },
        rishabh: {
            currentAllotted: 1,
            normalThreshold: 30,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        monika: {
            currentAllotted: 4,
            normalThreshold: 180,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        // rohan: {
        //     currentAllotted: 0,
        //     normalThreshold: 500,
        //     extraProcessingFolders: [],
        //     finisher: 'karan',
        // },
    },
    lot: [
        {
            imagesQty: 0,
            minimumDealerFoldersForEachContractors: 1,
        },
        {
            imagesQty: 0,
            minimumDealerFoldersForEachContractors: 1,
        },
        {
            imagesQty: 0,
            minimumDealerFoldersForEachContractors: 1,
        },
        {
            imagesQty: 300,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 300,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 300,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 400,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 5000,
            minimumDealerFoldersForEachContractors: false,
        },
    ],
};

// eslint-disable-next-line import/prefer-default-export
export { configUser };
