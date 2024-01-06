import axios from 'axios';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { instanceRunDateFormatted } from '../functions/datetime.js';
/* eslint-enable import/extensions */

export default async function sendLogToNtfy(filename, mesg) {
    if (new Date(instanceRunDateFormatted) > new Date(config.sendLogToNtfyUptoDate)) {
        return;
    }

    let URLToCall = 'http://ntfy.sh/dinesharora_autodown';
    const uniqueCode = mesg.substring(25, 34);
    mesg = mesg.substring(60);
    const mesgpParts = mesg.split('\n');
    const title = mesgpParts[0];
    mesg = mesgpParts.length > 1 ? mesgpParts.slice(1).join('\n') : '';

    let priority;
    let tags;
    let level;
    if (filename.endsWith('_unhandledexception.log')) {
        level = 'unhandledexception';
        priority = 5;
        tags = 'boom';
    } else if (filename.endsWith('_unreachable.log')) {
        level = 'unreachable';
        priority = 4;
        tags = 'volcano';
    } else if (filename.endsWith('_catcherror.log')) {
        level = 'catcherror';
        priority = 3;
        tags = 'rotating_light';
    } else if (filename.endsWith('_severe.log')) {
        level = 'severe';
        priority = 2;
        tags = 'triangular_flag_on_post';
    } else if (filename.endsWith('_error.log')) {
        level = 'error';
        priority = 1;
        tags = 'red_circle';
        URLToCall = 'http://ntfy.sh/dinesharora_autodown_errorlevelonly';
    } else {
        return;
    }
    tags += `,${level},${uniqueCode}`;
    mesg = mesg === '' ? 'ㅤ' : mesg;
    try {
        await axios.post(URLToCall, mesg, {
            timeout: 10000,
            headers: { Title: title, Tags: tags, Priority: priority },
        });
    } catch (error) {
        /**
         * Do Nothing
         */
    }
}
