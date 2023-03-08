import _ from 'lodash';
/* eslint-disable import/extensions */
import { configProduction } from './config-production.js';
import { configDevelopment } from './config-development.js';
import { configUser } from './config-user.js';
/* eslint-enable import/extensions */

const configBasic = {
    environment: 'development', // development Or production
    timezone: 'Asia/Calcutta',
    timeOffsetInMinutesToAvoid: 2,
    app: {
        port: 3000,
        name: 'myapp',
    },
    db: {
        host: 'localhost',
        port: 27017,
        name: 'db',
    },
    browserArgs: {
        headless: false,
        defaultViewport: null,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data', '--hide-crash-restore-bubble'],
    },
    // bookmarkPath: '/path/to/Chrome/Bookmark' OR '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks'
    bookmarkPath: 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks',
    bookmarkOptions: {
        shouldIncludeFolders: true,
    },
    dealerConfiguration: './configs/DealerConfiguration.xlsx',
    downloadPath: './Downloads',
    initialFolderBunchToDownload: 2,
    conractorsCurrentRatio: {
        ram: 1,
        karan: 1,
        pavan: 1,
        arjun: 1,
        om: 1,
        rohan: 1,
    },
};

/**
 *
 * Check for what environment it is and merge
 * config files accordingly.
 *
 */
let configToExport = '';
if (configBasic.environment === 'production') {
    configToExport = _.merge(configBasic, configProduction);
    configToExport = _.merge(configToExport, configUser);
} else if (configBasic.environment === 'development') {
    configToExport = _.merge(configBasic, configDevelopment);
    configToExport = _.merge(configToExport, configUser);
} else {
    configToExport = _.merge(configBasic, configUser);
}

const config = configToExport;

// eslint-disable-next-line import/prefer-default-export
export { config };
