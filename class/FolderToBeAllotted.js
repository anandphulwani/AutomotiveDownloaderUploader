/* eslint-disable no-underscore-dangle */
import path from 'path';

/* eslint-disable import/extensions */
import {
    getDealerFolderContractorsZonePath,
    getDealerFolderFinishedAllotmentZonePath,
    returnImageCountFromDealerDir,
} from '../functions/allotmentsupportive.js';
import { getAddTextToFolderNameByUsernameFromDC } from '../functions/excelsupportive.js';
/* eslint-enable import/extensions */

export default class FolderToBeAllotted {
    constructor(dealerFolderPath = undefined) {
        this._dealerFolderPath = dealerFolderPath;
        this._imageCount = this.computeImageCount(dealerFolderPath);
        this._username = this.computeUsername(dealerFolderPath);
        this._dealerFolderName = this.computeDealerFolderName(dealerFolderPath);
        this._usernameAndDealerFolderName = this.computeUsernameAndDealerFolderName();
        this._addTextToFolderName = this.computeAddTextToFolderName();

        this._contractorAllotted = null;

        this._uniqueId = null;
    }

    get dealerFolderPath() {
        return this._dealerFolderPath;
    }

    set dealerFolderPath(value) {
        this._dealerFolderPath = value;
        this._imageCount = this.computeImageCount(value);
        this._username = this.computeUsername(value);
        this._dealerFolderName = this.computeDealerFolderName(value);
        this._usernameAndDealerFolderName = this.computeUsernameAndDealerFolderName();
        this._addTextToFolderName = this.computeAddTextToFolderName();
    }

    // No setter for _imageCount as it's derived from _dealerFolderPath
    get imageCount() {
        return this._imageCount;
    }

    // No setter for _username as it's derived from _dealerFolderPath
    get username() {
        return this._username;
    }

    // No setter for _dealerFolderName as it's derived from _dealerFolderPath
    get dealerFolderName() {
        return this._dealerFolderName;
    }

    // No setter for _usernameAndDealerFolderName as it's derived from _dealerFolderPath
    get usernameAndDealerFolderName() {
        return this._usernameAndDealerFolderName;
    }

    // No setter for _addTextToFolderName as it's derived from _dealerFolderPath
    get addTextToFolderName() {
        return this._addTextToFolderName;
    }

    computeImageCount(folderPath) {
        return returnImageCountFromDealerDir(folderPath);
    }

    computeUsername(folderPath) {
        return path.basename(path.dirname(folderPath));
    }

    computeDealerFolderName(folderPath) {
        return path.basename(folderPath);
    }

    computeUsernameAndDealerFolderName() {
        return path.join(this._username, this._dealerFolderName);
    }

    computeAddTextToFolderName() {
        return getAddTextToFolderNameByUsernameFromDC(this._dealerFolderName, this._username);
    }

    /**
     *
     *
     */
    get contractorAllotted() {
        return this._contractorAllotted;
    }

    set contractorAllotted(value) {
        this._contractorAllotted = value;
    }

    /**
     *
     *
     */
    get uniqueId() {
        return this._uniqueId;
    }

    set uniqueId(value) {
        this._uniqueId = value;
        this._suffixTextToFolderName = this.computeSuffixTextToFolderName();
        this._destinationPath = this.computeDestinationPath();
        this._destinationRecordKeepingPath = this.computeDestinationRecordKeepingPath();
        this._destinationFolderName = this.computeDestinationFolderName();
        this._destinationFolderNameWithDate = this.computeDestinationFolderNameWithDate();
    }

    get suffixTextToFolderName() {
        return this._suffixTextToFolderName;
    }

    get destinationPath() {
        return this._destinationPath;
    }

    get destinationRecordKeepingPath() {
        return this._destinationRecordKeepingPath;
    }

    get destinationFolderName() {
        return this._destinationFolderName;
    }

    get destinationFolderNameWithDate() {
        return this._destinationFolderNameWithDate;
    }

    computeSuffixTextToFolderName() {
        return `${this._addTextToFolderName} ${this._contractorAllotted} ${this._imageCount} (#${this._uniqueId})`.trim();
    }

    computeDestinationPath() {
        // TODO: Bring this function to this class, if this function isnt used anywhere.
        return getDealerFolderContractorsZonePath(this._dealerFolderPath, this._contractorAllotted, this._suffixTextToFolderName);
    }

    computeDestinationRecordKeepingPath() {
        // TODO: Bring this function to this class, if this function isnt used anywhere.
        return getDealerFolderFinishedAllotmentZonePath(this._dealerFolderPath, this._suffixTextToFolderName);
    }

    computeDestinationFolderName() {
        return path.basename(this._destinationPath);
    }

    computeDestinationFolderNameWithDate() {
        const dateFromDestinationFolderPath = path.basename(path.dirname(this._destinationPath));
        return path.join(dateFromDestinationFolderPath, this._destinationFolderName);
    }
}
