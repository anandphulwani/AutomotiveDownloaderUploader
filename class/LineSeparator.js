class LineSeparator {
    constructor(name) {
        this.name = name;
        Object.freeze(this);
    }

    static get false() {
        return new LineSeparator(false);
    }

    static get true() {
        return new LineSeparator(true);
    }
}

Object.freeze(LineSeparator);

export default LineSeparator;
