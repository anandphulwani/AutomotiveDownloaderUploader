import chalk from 'chalk';
import fs from 'fs';

/* eslint-disable import/extensions */
import { lge, lgw, lgi, lgv, lgd, lgs, lgc } from './functions/loggersupportive.js';
/* eslint-enable import/extensions */

try {
    throw new Error('No One(1) Such known exception');
} catch (err) {
    lgc(err);
}

try {
    throw new Error('No Two(2) Such known exception');
} catch (err) {
    lgc(`cathcing now`, err);
}
try {
    throw new Error('No Three(3) Such known exception');
} catch (err) {
    lgc(`cathcing now`, err);
}
try {
    throw new Error('No Four(4) Such known exception');
} catch (err) {
    lgc(`cathcing now`, err);
}
try {
    throw new Error('No Five(5) Such known exception');
} catch (err) {
    lgc(`cathcing now`, err);
}

// eslint-disable-next-line no-undef
lge(`This is a error.`);
// lgw('This is a warn.');
// lgi('This is an info.');

// lgv('This is a verbose.');
// lgd('This is a debug.');
// lgs('This is a silly');
