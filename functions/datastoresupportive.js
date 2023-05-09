function getNumberOfImagesFromAllottedDealerNumberFolder(folderName) {
    const regexString = `.*? (\\d+) \\(\\#\\d{5}\\)`;
    const regexExpression = new RegExp(regexString, 'g');
    const match = folderName.match(regexExpression);
    return match[0].match(regexString)[1];
}

function getUniqueIDFromAllottedDealerNumberFolder(folderName) {
    const regexString = `.*? (\\d+) \\(\\#(\\d{5})\\)`;
    const regexExpression = new RegExp(regexString, 'g');
    const match = folderName.match(regexExpression);
    return match[0].match(regexString)[2];
}

function getUploadRemainingSummary(foldersToUpload) {
    const dealerFoldersQty = Object.keys(foldersToUpload).filter(
        (key) => foldersToUpload[key].imagesQty !== 0 && foldersToUpload[key].dealerFolderFilesQty !== 0
    ).length;
    const totalImagesQty = Object.values(foldersToUpload).reduce((acc, folder) => acc + folder.imagesQty, 0);
    const totalStockFolderFilesQty = Object.values(foldersToUpload).reduce((acc, folder) => acc + folder.dealerFolderFilesQty, 0);
    const totalTimeInSeconds = Math.round(totalImagesQty * 7.25 + totalStockFolderFilesQty * 7);
    const hours = Math.floor(totalTimeInSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((totalTimeInSeconds - hours * 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (totalTimeInSeconds % 60).toString().padStart(2, '0');
    return `Remaining DealerFolders: ${dealerFoldersQty}, Images: ${totalImagesQty}, StockFolder/StockFiles: ${totalStockFolderFilesQty}, Time: ${hours}:${minutes}:${seconds}`;
}
// eslint-disable-next-line import/prefer-default-export
export { getNumberOfImagesFromAllottedDealerNumberFolder, getUniqueIDFromAllottedDealerNumberFolder, getUploadRemainingSummary };
