/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lgi } from './loggerandlocksupportive.js';
import Color from '../class/Colors.js';
/* eslint-enable import/extensions */

export default function checkBrowserClosed(err, isEscalation) {
    let isBrowserClosed = false;
    if (
        config.browserClosingErrors.some((patternOrValue) =>
            typeof patternOrValue === 'string' ? err.message === patternOrValue : new RegExp(patternOrValue).test(err.message)
        )
    ) {
        isBrowserClosed = true;
    }

    if (isEscalation) {
        if (isBrowserClosed) {
            throw err;
        } else {
            /*
             * Do Nothing, let the remaining catch handler run, in the same catch block
             */
        }
    } else if (isBrowserClosed) {
        lgi('Browser has been manually closed.', Color.bgYellow);
    } else {
        throw err;
    }
}
