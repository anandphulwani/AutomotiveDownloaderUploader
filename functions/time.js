import chalk from 'chalk';
import { NtpTimeSync } from 'ntp-time-sync';

/**
 * Check if timezone matches of Asia/Calcutta
 */
function checkTimezone() {
    console.log(chalk.cyan('Check if timezone matches of Asia/Calcutta: Executing.'));
    if (Intl.DateTimeFormat().resolvedOptions().timeZone !== 'Asia/Calcutta') {
        console.log(chalk.white.bgRed.bold('System timezone is not set to India: Asia/Calcutta UTC+5.30 Hours'));
        process.exit(1);
    } else {
        console.log(chalk.green.bold('System timezone matches to India: Asia/Calcutta UTC+5.30 Hours'));
    }
    console.log(chalk.cyan('Check if timezone matches of Asia/Calcutta: Done.'));
}

/**
 * Check if time is in sync with online NTP servers.
 */
async function checkTimeWithNTP() {
    console.log(chalk.cyan('Check if time is in sync with online NTP servers.: Executing.'));
    const timeSync = NtpTimeSync.getInstance();
    await timeSync.getTime().then((result) => {
        console.log(chalk.cyan(`Current System time: ${new Date()},\nReal time (NTP Servers): ${result.now}`));
        const offsetInSeconds = Math.abs(Math.round(result.offset / 1000));
        if (offsetInSeconds > 2 * 60) {
            console.log(
                chalk.white.bgRed.bold(
                    `System time not set accurately, time is off by ${offsetInSeconds} seconds (${result.offset}ms), \nPlease re sync time with NTP server.`
                )
            );
            process.exit(1);
        } else {
            console.log(
                chalk.green.bold(
                    `System time shows accurate data i.e. (within 2 mins differnce), current offset is ${offsetInSeconds} seconds (${result.offset}ms).`
                )
            );
        }
    });
    console.log(chalk.cyan('Check if time is in sync with online NTP servers.: Done.'));
}

export { checkTimezone, checkTimeWithNTP };
