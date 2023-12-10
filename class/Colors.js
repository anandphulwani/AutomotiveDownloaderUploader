class Color {
    constructor(name) {
        this.name = name;
        Object.freeze(this);
    }

    static get cyanNormal() {
        return new Color('cyanNormal');
    }

    static get cyan() {
        return new Color('cyan');
    }

    static get bgCyan() {
        return new Color('bgCyan');
    }

    static get green() {
        return new Color('green');
    }

    static get bgGreen() {
        return new Color('bgGreen');
    }

    static get yellow() {
        return new Color('yellow');
    }

    static get bgYellow() {
        return new Color('bgYellow');
    }

    static get red() {
        return new Color('red');
    }

    static get bgRed() {
        return new Color('bgRed');
    }

    static get magenta() {
        return new Color('magenta');
    }

    static get bgMagenta() {
        return new Color('bgMagenta');
    }

    static get white() {
        return new Color('white');
    }

    static get bgWhite() {
        return new Color('bgWhite');
    }
}

Object.freeze(Color);

export default Color;
