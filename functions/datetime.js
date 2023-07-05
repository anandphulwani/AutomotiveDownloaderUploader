import date from 'date-and-time';

const instanceRunDateFormatted = date.format(new Date(), 'YYYY-MM-DD');
const instanceRunTimeFormatted = date.format(new Date(), 'HHmmssSSS');
const instanceRunDateTimeFormatted = date.format(new Date(), 'YYYYMMDD-HHmmssSSS');
const instanceRunDateTimeWOMSFormatted = date.format(new Date(), 'YYYYMMDD-HHmmss');
const instanceRunDateTimeReadableFormatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');
const instanceRunDateTimeWOMSReadableFormatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

const currentDateFormatted = () => date.format(new Date(), 'YYYY-MM-DD');
const currentTimeFormatted = () => date.format(new Date(), 'HHmmssSSS');
const currentDateTimeFormatted = () => date.format(new Date(), 'YYYYMMDD-HHmmssSSS');
const currentDateTimeWOMSFormatted = () => date.format(new Date(), 'YYYYMMDD-HHmmss');
const currentDateTimeReadableFormatted = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss:SSS');
const currentDateTimeWOMSReadableFormatted = () => date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

export {
    instanceRunDateFormatted,
    instanceRunTimeFormatted,
    instanceRunDateTimeFormatted,
    instanceRunDateTimeWOMSFormatted,
    instanceRunDateTimeReadableFormatted,
    instanceRunDateTimeWOMSReadableFormatted,
    currentDateFormatted,
    currentTimeFormatted,
    currentDateTimeFormatted,
    currentDateTimeWOMSFormatted,
    currentDateTimeReadableFormatted,
    currentDateTimeWOMSReadableFormatted,
};
