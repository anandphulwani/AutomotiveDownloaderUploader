import pos from 'get-cursor-position';

async function getRowPosOnTerminal() {
    return pos.sync().row;
}

// eslint-disable-next-line import/prefer-default-export
export { getRowPosOnTerminal };
