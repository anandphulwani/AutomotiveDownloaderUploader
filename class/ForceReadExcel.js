const ForceReadExcel = {
    true: Symbol('true'),
    false: Symbol('false'),
    onlyIfModificationTimeChanges: Symbol('onlyIfModificationTimeChanges'),
};

Object.freeze(ForceReadExcel);

export default ForceReadExcel;
