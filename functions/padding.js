function zeroPad(num, places) {
    const zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
}

// eslint-disable-next-line import/prefer-default-export
export { zeroPad };
