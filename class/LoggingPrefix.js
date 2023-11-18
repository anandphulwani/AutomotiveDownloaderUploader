class LoggingPrefix {
    constructor(name) {
        this.name = name;
        Object.freeze(this);
    }

    static get false() {
        return new LoggingPrefix(false);
    }

    static get true() {
        return new LoggingPrefix(true);
    }
}

Object.freeze(LoggingPrefix);

export default LoggingPrefix;
