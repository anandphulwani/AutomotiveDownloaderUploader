import getCursorPosition from 'get-cursor-position';

function getRowPosOnTerminal() {
    return getCursorPosition.sync().row;
}

function getColPosOnTerminal() {
    return getCursorPosition.sync().col;
}

// eslint-disable-next-line import/prefer-default-export
export { getRowPosOnTerminal, getColPosOnTerminal };
