// Configuration in this file will override all settings in other config files
const configUser = {
    // environment: 'production',
    // timezone: 'Asia/Calcutta',
    // appDomain: 'https://www.homenetiol.com',
    // timeOffsetInMinutesToAvoid: 2,
    // browserArgs: { headless: true },
    // bookmarkPath: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks',
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
    // dealerConfiguration: './configs/DealerConfiguration.xlsx',
    // downloadPath: '.\\datastore\\Downloads',
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
        karan: {
            currentStatus: 0,
            normalThreshold: 100,
            higherThreshold: 150,
        },
        pavan: {
            currentStatus: 0,
            normalThreshold: 100,
            higherThreshold: 150,
        },
        ram: {
            currentStatus: 0,
            normalThreshold: 300,
            higherThreshold: 500,
        },
        arjun: {
            currentStatus: 0,
            normalThreshold: 100,
            higherThreshold: 150,
        },
        om: {
            currentStatus: 0,
            normalThreshold: 100,
            higherThreshold: 150,
        },
        // rohan: {
        //     normalThreshold: 500,
        //     higherThreshold: 500,
        // },
    },
    lot: [
        {
            imagesQty: 0,
            minimumDealerFoldersForEachContractors: 2,
        },
        {
            imagesQty: 15,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 300,
            minimumDealerFoldersForEachContractors: false,
        },
        {
            imagesQty: 600,
            minimumDealerFoldersForEachContractors: false,
        },
    ],
};

// eslint-disable-next-line import/prefer-default-export
export { configUser };
