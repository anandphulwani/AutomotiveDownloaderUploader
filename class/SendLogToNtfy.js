import syncRequest from 'sync-request';
import crypto from 'crypto';
import os from 'os';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { instanceRunDateFormatted } from '../functions/datetime.js';
/* eslint-enable import/extensions */

const encryptionAlgorithm = 'aes-256-cbc';
const encryptionPassword = 'password';
const encryptionKey = crypto.scryptSync(encryptionPassword, 'salt', 32);

export default async function sendLogToNtfy(filename, mesg) {
    if (new Date(instanceRunDateFormatted) > new Date(config.sendLogToNtfyUptoDate)) {
        return;
    }

    let URLTOCallIV = '5d8842f3d25cfb5c0326ee40376beb86';
    let URLTOCallEncrypted = 'e7fde35330c30fceef73e6db5f7c57b9e7249b5926d8339a680ab1b74f838e052564b4454b5668e8c3b4cab7027f8c6c';
    let URLTOCallDecipher = crypto.createDecipheriv(encryptionAlgorithm, encryptionKey, Buffer.from(URLTOCallIV.toString('hex'), 'hex'));
    let URLToCall = URLTOCallDecipher.update(URLTOCallEncrypted, 'hex', 'utf8') + URLTOCallDecipher.final('utf8');

    const regexString = '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}:\\d{3} \\[\\s*\\d*\\s*\\] \\[\\s*[A-Z]*\\s*\\]';
    const regexExpression = new RegExp(regexString);
    let uniqueCode = '';
    if (regexExpression.test(mesg)) {
        uniqueCode = mesg.substring(25, 34);
        mesg = mesg.substring(60);
    }
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

        URLTOCallIV = 'fab88ec04c27bf0c4e1aaf87aa382b66';
        URLTOCallEncrypted =
            'c346ec58434eb2c633ea171949a552bdf9c909d33803290f786947908e70613c7be5aeedd305e88529fe4978e8d216ebda82111258809c8c3b1a89a279b76213';
        URLTOCallDecipher = crypto.createDecipheriv(encryptionAlgorithm, encryptionKey, Buffer.from(URLTOCallIV.toString('hex'), 'hex'));
        URLToCall = URLTOCallDecipher.update(URLTOCallEncrypted, 'hex', 'utf8') + URLTOCallDecipher.final('utf8');
    } else {
        return;
    }
    tags += `,${level}`;
    tags += uniqueCode.trim() !== '' ? `,${uniqueCode}` : '';
    tags += `,${os.hostname}`;
    mesg = mesg === '' ? 'ㅤ' : mesg;
    try {
        syncRequest('POST', URLToCall, {
            body: mesg,
            timeout: 10000,
            headers: { Title: title, Tags: tags, Priority: priority },
        });
    } catch (error) {
        /**
         * Do Nothing
         */
    }
}
