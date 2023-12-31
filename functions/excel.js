import fs from 'fs';
import xlsx from 'xlsx';
import chalk from 'chalk';
/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import {
    allTrimStringArrayOfObjects,
    trimMultipleSpacesInMiddleIntoOneArrayOfObjects,
    trimSingleSpaceInMiddleArrayOfObjects,
    trimSingleSpaceInMiddleArray,
} from './stringformatting.js';
import { lgd, lge } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

function readDealerConfigurationExcel(username, debug = false) {
    const excelFilename = `${config.dealerConfigurationFolder}\\${username}.xlsx`;
    if (!fs.existsSync(excelFilename)) {
        lge(`Dealer configuration excel file: ${excelFilename} does not exist, Please check.`);
        process.exit(1);
    }
    const file = xlsx.readFile(excelFilename);
    const data = [];
    const sheets = file.SheetNames;
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {
            // range: "",
            raw: false,
            // header: 1,
        });
        temp.forEach((res) => {
            data.push(res);
        });
    }
    debug ? lgd(data) : null;
    return data;
}

function readDealerConfigurationFormatted(username, debug = false) {
    let data = readDealerConfigurationExcel(username);
    data = allTrimStringArrayOfObjects(data);
    data = trimMultipleSpacesInMiddleIntoOneArrayOfObjects(data);
    debug ? lgd(data) : null;
    return data;
}

export { readDealerConfigurationExcel, readDealerConfigurationFormatted };
