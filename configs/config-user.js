// Configuration in this file will override all settings in other config files
const configUser = {
    // environment: 'production', // development Or production
    // timezone: 'Asia/Calcutta',
    // appDomain: 'https://www.homenetiol.com',
    // timeOffsetInMinutesToAvoid: 2,
    // sourceBookmarkPath: '.\\datastore\\Bookmarks',
    // processingBookmarkPathWithoutSync: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks',
    // updateBookmarksOnceDone: true,
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
    // uploadingZonePath: '.\\datastore\\UploadingZone',
    // finishedUploadingZonePath: '.\\datastore\\FinishedUploadingZone',
    // recordKeepingZonePath: '.\\datastore\\RecordKeepingZone',
    automaticClickSaveButtonOnUpload: false,
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
    contractors: {
        biswas: {
            currentAllotted: 0,
            normalThreshold: 800,
            processingFolders: ['000_Done'],
        },
        saikat: {
            currentAllotted: 0,
            normalThreshold: 300,
            processingFolders: ['000_Done'],
        },
        sachin: {
            currentAllotted: 0,
            normalThreshold: 450,
            processingFolders: ['000_Done', '000_ReadyToUpload'],
        },
        shivani: {
            currentAllotted: 0,
            normalThreshold: 250,
            processingFolders: ['000_Done'],
        },
        rakesh: {
            currentAllotted: 0,
            normalThreshold: 200,
            processingFolders: ['000_Done'],
        },
        poonam: {
            currentAllotted: 0,
            normalThreshold: 100,
            processingFolders: ['000_Done'],
        },
        kalpana: {
            currentAllotted: 0,
            normalThreshold: 100,
            processingFolders: ['000_Done'],
        },
        rishabh: {
            currentAllotted: 0,
            normalThreshold: 0,
            processingFolders: ['000_Done', '000_ReadyToUpload'],
        },
        monika: {
            currentAllotted: 0,
            normalThreshold: 100,
            processingFolders: ['000_Done', '000_ReadyToUpload'],
        },
        // rohan: {
        //     currentAllotted: 0,
        //     normalThreshold: 500,
        //     processingFolders: ['000_Done', '000_ReadyToUpload'],
        // },
    },
    lot: [
        {
            imagesQty: 0,
            minimumDealerFoldersForEachContractors: 1,
        },
        {
            imagesQty: 0,
            minimumDealerFoldersForEachContractors: 2,
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
            imagesQty: 500,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 600,
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
