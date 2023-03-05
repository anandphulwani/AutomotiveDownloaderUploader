import xlsx from 'xlsx';
// eslint-disable-next-line import/extensions
import { config } from '../configs/config.js';

function readDealerConfiguration() {
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

// eslint-disable-next-line import/prefer-default-export
export { readDealerConfiguration };
