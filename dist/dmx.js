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
        this.claimed = new Array(513).fill({ fixture: undefined, type: '' });
    }
    setValues(changes, duration, fixtureId) {
        if (!fixtureId)
            fixtureId = '';
        let changedFixtureIds = [];
        let changedFixtures = [];
        let oldValues = [];
        for (let x = 0; x < changes.length; x++) {
            if (!Number.isInteger(changes[x].channel) ||
                changes[x].channel <= 0 ||
                changes[x].channel > 512) {
                console.error('Invalid DMX channel: ' + changes[x].channel);
                return;
            }
            if (!Number.isFinite(changes[x].value) ||
                changes[x].value < 0 ||
                changes[x].value > 255) {
                console.error('Invalid DMX value: ' + changes[x].value);
                return;
            }
            oldValues.push({
                channel: changes[x].channel,
                value: this._dmxArray[changes[x].channel],
            });
            this._dmxArray[changes[x].channel] = changes[x].value;
            if (this.claimed[changes[x].channel].fixture) {
                let changedFixture = this.claimed[changes[x].channel].fixture;
                if (changedFixture.id != fixtureId && changedFixtureIds.indexOf(changedFixture.id) == -1) {
                    changedFixtureIds.push(changedFixture.id);
                    changedFixtures.push(changedFixture);
                }
            }
        }
        //send to dmx serial port?
        for (let x = 0; x < changedFixtures.length; x++) {
            changedFixtures[x].dmxUpdate();
        }
        this.emit('change', changes, oldValues);
    }
    getValue(channel) {
        if (channel == undefined)
            return this._dmxArray.slice(0);
        if (!Number.isInteger(channel) || channel <= 0 || channel > 512) {
            if (channel != 0)
                console.error('Invalid DMX channel:' + channel);
            return;
        }
        return this._dmxArray[channel];
    }
}
exports.default = Dmx;
