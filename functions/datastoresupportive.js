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

// eslint-disable-next-line import/prefer-default-export
export { getNumberOfImagesFromAllottedDealerNumberFolder, getUniqueIDFromAllottedDealerNumberFolder };
