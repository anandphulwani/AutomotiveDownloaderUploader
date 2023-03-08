import xlsx from 'xlsx';
/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import {
    allTrimStringArrayOfObjects,
    trimMultipleSpacesInMiddleIntoOneArrayOfObjects,
    trimSingleSpaceInMiddleArrayOfObjects,
    trimSingleSpaceInMiddleArray,
} from './stringformatting.js';
/* eslint-enable import/extensions */

function readDealerConfigurationExcel() {
    const file = xlsx.readFile(config.dealerConfiguration);
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
    return data; // console.log(data); // Printing data
}

function readDealerConfigurationFormatted() {
    let data = readDealerConfigurationExcel();
    data = allTrimStringArrayOfObjects(data);
    data = trimMultipleSpacesInMiddleIntoOneArrayOfObjects(data);
    // console.log(data);
    return data;
}

export { readDealerConfigurationExcel, readDealerConfigurationFormatted };
