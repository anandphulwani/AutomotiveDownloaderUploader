import chalk from 'chalk';
import { NtpTimeSync } from 'ntp-time-sync';
/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lge, lgi } from './loggerandlocksupportive.js';
import Color from '../class/Colors.js';
/* eslint-enable import/extensions */

/**
 * Check if timezone matches from timezone in configuration.
 */
function checkTimezone() {
    lgi(`Check if timezone matches of ${config.timezone}: Executing.`);
    if (Intl.DateTimeFormat().resolvedOptions().timeZone !== config.timezone) {
        lge(`System timezone is not set to India: ${config.timezone}`);
        process.exit(1);
    } else {
        lgi(`System timezone matches to: ${config.timezone}`, Color.green);
    }
    lgi(`Check if timezone matches of ${config.timezone}: Done.`);
}

/**
 * Check if time is in sync with online NTP servers.
 */
async function checkTimeWithNTP() {
    lgi('Check if time is in sync with online NTP servers.: Executing.');
    const timeSync = NtpTimeSync.getInstance();
    await timeSync.getTime().then((result) => {
        lgi(`Current System time: ${new Date()},`);
        lgi(`Real time (NTP Servers): ${result.now}`);
        const offsetInSeconds = Math.abs(Math.round(result.offset / 1000));
        if (offsetInSeconds > config.timeOffsetInMinutesToAvoid * 60) {
            lge(
                `System time not set accurately, time is off by ${offsetInSeconds} seconds (${result.offset}ms), \nPlease re sync time with NTP server.`
            );
            process.exit(1);
        } else {
            lgi(
                `System time shows accurate data i.e. (within ${config.timeOffsetInMinutesToAvoid} mins differnce), current offset is ${offsetInSeconds} seconds (${result.offset}ms).`,
                Color.green
            );
        }
    });
    lgi('Check if time is in sync with online NTP servers.: Done.');
}

export { checkTimezone, checkTimeWithNTP };
