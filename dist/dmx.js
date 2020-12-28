'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const serialport_1 = __importDefault(require("serialport"));
class Dmx extends events_1.EventEmitter {
    constructor() {
        super();
        this._devDMX = '/dev/ttyUSB0';
        this._dmxArray = new Array(513).fill(0);
        this._dmxBuffer = Buffer.alloc(513, 0);
        this._header = Buffer.from([
            0x7e,
            0x06,
            this._dmxBuffer.length & 0xff,
            (this._dmxBuffer.length >> 8) & 0xff,
        ]);
        this._updateCycleTime = 100; //How far apart to enforce DMX updates, in milliseconds
        this._footer = Buffer.from([0xe7]);
        this._lastUpdate = new Date().getTime();
        this._stream = new serialport_1.default(this._devDMX, {
            baudRate: 250000,
            dataBits: 8,
            stopBits: 2,
            parity: 'none',
        }, (err) => {
            if (!err) {
                this._stream.on('error', (err) => {
                    console.error(err);
                });
            }
            else {
                console.error(err);
            }
        });
        this._sendArray = () => {
            this._dmxArray[0] = 0;
            this._dmxBuffer = Buffer.from(this._dmxArray);
            this._dmxBuffer[0] = 0xff;
            let delay = this._lastUpdate + this._updateCycleTime - new Date().getTime();
            if (delay > 0) {
                setTimeout(() => {
                    this._pushBuffer();
                }, delay);
            }
            else {
                this._pushBuffer();
            }
        };
        this._pushBuffer = () => {
            if (this._stream.writable) {
                let msg = Buffer.concat([this._header, this._dmxBuffer, this._footer]);
                this._lastUpdate = new Date().getTime();
                this._stream.write(msg);
                this._stream.drain(() => {
                    this._lastUpdate = new Date().getTime();
                });
            }
        };
    }
    setValue(channel, value, duration) {
        if (!Number.isInteger(channel) || channel <= 0 || channel > 512) {
            console.error('Invalid DMX channel');
            return;
        }
        if ((!value && value != 0) || value < 0 || value > 1) {
            console.error('Invalid DMX value: ' + value);
            return;
        }
        this._dmxArray[channel] = value;
        this.emit('change', this._dmxArray.slice(0));
    }
    getValue(channel) {
        if (!channel)
            return this._dmxArray.slice(0);
        if (!Number.isInteger(channel) || channel <= 0 || channel > 512) {
            console.error('Invalid DMX channel');
            return;
        }
        return this._dmxArray[channel];
    }
}
exports.default = Dmx;
