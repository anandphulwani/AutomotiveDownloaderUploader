import path from 'path';
import { fileURLToPath } from 'url';

function getProjectRootDirPath() {
    // eslint-disable-next-line no-underscore-dangle
    return path.dirname(path.dirname(fileURLToPath(import.meta.url)));
}

function getProjectConfigDirPath() {
    return path.join(getProjectRootDirPath(), 'configs');
}

function getProjectLogsDirPath() {
    return path.join(getProjectRootDirPath(), 'logs');
}

function getProjectConfigFilePath() {
    return path.join(getProjectConfigDirPath(), 'config.js');
}

function getProjectConfigUniqueIdsFilePath() {
    return path.join(getProjectConfigDirPath(), 'config-unique-ids.js');
}

function getProjectConfigLotLastFilePath() {
    return path.join(getProjectConfigDirPath(), 'config-lot-last.js');
}

export {
    getProjectRootDirPath,
    getProjectConfigDirPath,
    getProjectLogsDirPath,
    getProjectConfigFilePath,
    getProjectConfigUniqueIdsFilePath,
    getProjectConfigLotLastFilePath,
};
