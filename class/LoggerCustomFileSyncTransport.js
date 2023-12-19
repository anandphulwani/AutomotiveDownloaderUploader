import Transport from 'winston-transport';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export default class LoggerCustomFileSyncTransport extends Transport {
    constructor(opts) {
        super(opts);
        // Ensure log directory exists
        const logDir = dirname(opts.filename);
        if (!existsSync(logDir)) {
            mkdirSync(logDir, { recursive: true });
        }
        this.filename = opts.filename;
        this.logFormat = opts.format; // Your custom formatting pipeline
        this.eol = opts.eol;
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        // Apply the custom formatting pipeline
        const formattedInfo = info;
        if (this.logFormat) {
            const symbols = Object.getOwnPropertySymbols(formattedInfo);
            const symbolMessage = symbols.find((sym) => sym.toString() === 'Symbol(message)');
            formattedInfo.message = symbolMessage ? formattedInfo[symbolMessage] : null;
        }
        // Create the log message string
        let message = formattedInfo.message + (this.eol === undefined ? '\n' : this.eol);
        message = message.replace(/.\[\d{1,5}m/g, '§');
        message = message.replace(/§√§/g, '√');
        message = message.replace(/§‼§/g, '‼');
        message = message.replace(/§×§/g, '×');
        // Synchronously write log message to file
        try {
            writeFileSync(this.filename, message, { flag: 'a' });
        } catch (err) {
            console.error('Error writing to log file:', err);
            process.exit(1);
        }
        callback();
    }
}
