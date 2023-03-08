import _ from 'lodash';

function zeroPad(num, places) {
    const zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
}

function allTrimStringArrayOfObjects(arrObj) {
    // return _.each(structuredClone(arrObj), (o) => _.each(o, (v, k) => (v !== undefined ? (o[k] = v.trim()) : ''))); // Check doing nothing on false ternary operator
    // eslint-disable-next-line no-return-assign
    return _.each(structuredClone(arrObj), (o) => _.each(o, (v, k) => (o[k] = v.trim())));
}

function allTrimStringArray(arr) {
    // eslint-disable-next-line no-return-assign
    return arr.map((element) => (element !== undefined ? element.trim() : element));
}

function trimMultipleSpacesInMiddleIntoOneArrayOfObjects(arrObj) {
    // return _.each(structuredClone(arrObj), (o) => _.each(o, (v, k) => (v !== undefined ? (o[k] = v.replace(/  +/g, ' ')) : ''))); // Check doing nothing on false ternary operator
    // eslint-disable-next-line no-return-assign
    return _.each(structuredClone(arrObj), (o) => _.each(o, (v, k) => (o[k] = v.replace(/  +/g, ' '))));
}

function trimMultipleSpacesInMiddleIntoOneArray(arr) {
    // eslint-disable-next-line no-return-assign
    return arr.map((element) => (element !== undefined ? element.replace(/  +/g, ' ') : element));
}

function trimSingleSpaceInMiddleArrayOfObjects(arrObj) {
    // return _.each(structuredClone(arrObj), (o) => _.each(o, (v, k) => (v !== undefined ? (o[k] = v.replace(/  +/g, ' ')) : ''))); // Check doing nothing on false ternary operator
    // eslint-disable-next-line no-return-assign
    return _.each(structuredClone(arrObj), (o) => _.each(o, (v, k) => (o[k] = v.replace(/  +/g, ''))));
}

function trimSingleSpaceInMiddleArray(arr) {
    // eslint-disable-next-line no-return-assign
    return arr.map((element) => (element !== undefined ? element.replace(/  +/g, '') : element));
}

function removeDuplicates(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

export {
    zeroPad,
    allTrimStringArray,
    allTrimStringArrayOfObjects,
    trimMultipleSpacesInMiddleIntoOneArray,
    trimMultipleSpacesInMiddleIntoOneArrayOfObjects,
    trimSingleSpaceInMiddleArrayOfObjects,
    trimSingleSpaceInMiddleArray,
    removeDuplicates,
};
