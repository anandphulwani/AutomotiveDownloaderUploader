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
    // conractorsRatioToMaintain: {
    //     ram: 20,
    //     karan: 20,
    //     pavan: 20,
    //     arjun: 20,
    //     om: 10,
    //     rohan: 10,
    // },
};

// eslint-disable-next-line import/prefer-default-export
export { configUser };
