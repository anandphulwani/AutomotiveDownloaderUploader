// Configuration in this file will override all settings in other config files
const configUser = {
    // timezone: 'Asia/Calcutta',
    // timeOffsetInMinutesToAvoid: 2,
    // browserArgs: { headless: true },
    // bookmarkPath: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks',
    // dealerConfiguration: './configs/DealerConfiguration.xlsx',
    // downloadPath: './Downloads',
    // initialFolderBunchToDownload: 2,
    environment: 'productions',
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
        ram: {
            normalThreshold: 500,
            higherThreshold: 500,
        },
        karan: {
            normalThreshold: 500,
            higherThreshold: 500,
        },
        pavan: {
            normalThreshold: 500,
            higherThreshold: 500,
        },
        arjun: {
            normalThreshold: 500,
            higherThreshold: 500,
        },
        om: {
            normalThreshold: 500,
            higherThreshold: 500,
        },
        rohan: {
            normalThreshold: 500,
            higherThreshold: 500,
        },
    },
    lot: [
        {
            quantity: 2,
            isImagesOrDealerFolders: 'dealerfolders',
        },
        {
            quantity: 600,
            isImagesOrDealerFolders: 'images',
        },
    ],
};

// eslint-disable-next-line import/prefer-default-export
export { configUser };
