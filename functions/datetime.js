import date from 'date-and-time';

const instanceRunDateFormatted = date.format(new Date(), 'YYYY-MM-DD');
const instanceRunDateWODayFormatted = date.format(new Date(), 'YYYY-MM');
const instanceRunTimeFormatted = date.format(new Date(), 'HHmmssSSS');
const instanceRunDateTimeFormatted = date.format(new Date(), 'YYYYMMDD-HHmmssSSS');
const instanceRunDateTimeWOMSFormatted = date.format(new Date(), 'YYYYMMDD-HHmmss');
const instanceRunDateTimeReadableFormatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');
const instanceRunDateTimeWOMSReadableFormatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

const currentDateFormatted = () => date.format(new Date(), 'YYYY-MM-DD');
const currentDateWODayFormatted = () => date.format(new Date(), 'YYYY-MM');
const currentTimeFormatted = () => date.format(new Date(), 'HHmmssSSS');
const currentDateTimeFormatted = () => date.format(new Date(), 'YYYYMMDD-HHmmssSSS');
const currentDateTimeWOMSFormatted = () => date.format(new Date(), 'YYYYMMDD-HHmmss');
const currentDateTimeReadableFormatted = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');
const currentDateTimeWOMSReadableFormatted = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

export {
    instanceRunDateFormatted,
    instanceRunDateWODayFormatted,
    instanceRunTimeFormatted,
    instanceRunDateTimeFormatted,
    instanceRunDateTimeWOMSFormatted,
    instanceRunDateTimeReadableFormatted,
    instanceRunDateTimeWOMSReadableFormatted,
    currentDateFormatted,
    currentDateWODayFormatted,
    currentTimeFormatted,
    currentDateTimeFormatted,
    currentDateTimeWOMSFormatted,
    currentDateTimeReadableFormatted,
    currentDateTimeWOMSReadableFormatted,
};
