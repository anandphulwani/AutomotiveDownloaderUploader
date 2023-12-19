function clearLastLinesOnConsole(noOfLines) {
    for (let index = 0; index < noOfLines; index++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine();
    }
    process.stdout.cursorTo(0);
}

// eslint-disable-next-line import/prefer-default-export
export { clearLastLinesOnConsole };
