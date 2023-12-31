import date from 'date-and-time';

const instanceRunDateFormatted = date.format(new Date(), 'YYYY-MM-DD');
const instanceRunDateWODayFormatted = date.format(new Date(), 'YYYY-MM');
const instanceRunTime = date.format(new Date(), 'HHmmssSSS');
const instanceRunTimeWOMS = date.format(new Date(), 'HHmmss');
const instanceRunTimeWOMSFormatted = date.format(new Date(), 'HH:mm:ss');
const instanceRunTimeWOSSMSFormatted = date.format(new Date(), 'HH:mm');
const instanceRunDateTimeSeparated = date.format(new Date(), 'YYYYMMDD-HHmmssSSS');
const instanceRunDateTimeWOMSSeparated = date.format(new Date(), 'YYYYMMDD-HHmmss');
const instanceRunDateTimeReadableFormatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');
const instanceRunDateTimeWOMSReadableFormatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

const currentDateFormatted = () => date.format(new Date(), 'YYYY-MM-DD');
const currentDateWODayFormatted = () => date.format(new Date(), 'YYYY-MM');
const currentTime = () => date.format(new Date(), 'HHmmssSSS');
const currentTimeWOMS = () => date.format(new Date(), 'HHmmss');
const currentTimeWOMSFormatted = () => date.format(new Date(), 'HH:mm:ss');
const currentTimeWOSSMSFormatted = () => date.format(new Date(), 'HH:mm');
const currentDateTimeSeparated = () => date.format(new Date(), 'YYYYMMDD-HHmmssSSS');
const currentDateTimeWOMSSeparated = () => date.format(new Date(), 'YYYYMMDD-HHmmss');
const currentDateTimeReadableFormatted = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');
const currentDateTimeWOMSReadableFormatted = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

function getCurrentDate() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Note: Months are 0-indexed in JavaScript
    const currentDay = currentDate.getDate();
    return { year: currentYear, month: currentMonth, day: currentDay };
}

function getLastMonthDate() {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    const lastMonthYear = currentDate.getFullYear();
    const lastMonthMonth = currentDate.getMonth() + 1;
    const lastMonthDay = currentDate.getDate();
    return { year: lastMonthYear, month: lastMonthMonth, day: lastMonthDay };
}

function formatDate(inputDate, fromAndTo) {
    if (fromAndTo === 'DD-MMM-YYYY__YYYY-MM-DD') {
        const parts = inputDate.split('-');
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const numericMonth = monthNames.indexOf(month) + 1;
        const formattedDate = new Date(`${year}-${numericMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
        return formattedDate.toISOString().split('T')[0];
    }
    if (fromAndTo === 'DD-MMM-YYYY__DD(EEE)') {
        const parts = inputDate.split('-');
        const day = `${parseInt(parts[0], 10)}`.padStart(2, '0');
        const monthStr = parts[1];
        const year = parseInt(parts[2], 10);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames.findIndex((monthAbbr) => monthAbbr === monthStr);
        const formattedDate = new Date(year, month, day);
        const dayOfWeekIndex = formattedDate.getDay();
        const abbreviatedDayName = dayNames[dayOfWeekIndex];
        return `${day} (${abbreviatedDayName})`;
    }
    return false;
}

export {
    instanceRunDateFormatted,
    instanceRunDateWODayFormatted,
    instanceRunTime,
    instanceRunTimeWOMS,
    instanceRunTimeWOMSFormatted,
    instanceRunTimeWOSSMSFormatted,
    instanceRunDateTimeSeparated,
    instanceRunDateTimeWOMSSeparated,
    instanceRunDateTimeReadableFormatted,
    instanceRunDateTimeWOMSReadableFormatted,
    currentDateFormatted,
    currentDateWODayFormatted,
    currentTime,
    currentTimeWOMS,
    currentTimeWOMSFormatted,
    currentTimeWOSSMSFormatted,
    currentDateTimeSeparated,
    currentDateTimeWOMSSeparated,
    currentDateTimeReadableFormatted,
    currentDateTimeWOMSReadableFormatted,
    getCurrentDate,
    getLastMonthDate,
    formatDate,
};
