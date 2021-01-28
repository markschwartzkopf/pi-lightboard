'use strict';
import { EventEmitter } from 'events';
import SerialPort from 'serialport';

declare interface Dmx {
  on(
    event: 'change',
    listener: (changes: dmxChange[], oldValues: dmxChange[]) => void
  ): this;
}

class Dmx extends EventEmitter {
  private _devDMX = '/dev/ttyUSB0';
  private _dmxArray: number[] = new Array(513).fill(0);
  private _dmxBuffer = Buffer.alloc(513, 0);
  private _header = Buffer.from([
    0x7e,
    0x06,
    this._dmxBuffer.length & 0xff,
    (this._dmxBuffer.length >> 8) & 0xff,
  ]);
  private _updateCycleTime = 100; //How far apart to enforce DMX updates, in milliseconds
  private _footer = Buffer.from([0xe7]);
  private _lastUpdate = new Date().getTime();
  private _stream = new SerialPort(
    this._devDMX,
    {
      baudRate: 250000,
      dataBits: 8,
      stopBits: 2,
      parity: 'none',
    },
    (err) => {
      if (!err) {
        this._stream.on('error', (err: string) => {
          console.error(err);
        });
      } else {
        console.error(err);
      }
    }
  );
  private _sendArray = () => {
    this._dmxArray[0] = 0;
    this._dmxBuffer = Buffer.from(this._dmxArray);
    this._dmxBuffer[0] = 0xff;
    let delay = this._lastUpdate + this._updateCycleTime - new Date().getTime();
    if (delay > 0) {
      setTimeout(() => {
        this._pushBuffer();
      }, delay);
    } else {
      this._pushBuffer();
    }
  };

  private _pushBuffer = () => {
    if (this._stream.writable) {
      let msg = Buffer.concat([this._header, this._dmxBuffer, this._footer]);
      this._lastUpdate = new Date().getTime();
      this._stream.write(msg);
      this._stream.drain(() => {
        this._lastUpdate = new Date().getTime();
      });
    }
  };

  claimed: dmxClaim[] = new Array(513).fill({ fixture: undefined, type: '' });

  constructor() {
    super();
  }

  setValues(changes: dmxChange[], duration?: number, fixtureId?: number) {
    if (!fixtureId) fixtureId = -1;
    let changedFixtureIds: number[] = [];
    let changedFixtures: import('./fixtures').default[] = [];
    let oldValues: dmxChange[] = [];
    for (let x = 0; x < changes.length; x++) {
      if (
        !Number.isInteger(changes[x].channel) ||
        changes[x].channel <= 0 ||
        changes[x].channel > 512
      ) {
        console.error('Invalid DMX channel: ' + changes[x].channel);
        return;
      }
      if (
        !Number.isFinite(changes[x].value) ||
        changes[x].value < 0 ||
        changes[x].value > 255
      ) {
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
        if (changedFixture!.id != fixtureId && changedFixtureIds.indexOf(changedFixture!.id) == -1) {
          changedFixtureIds.push(changedFixture!.id);
          changedFixtures.push(changedFixture!);
        }
      }
    }
    //send to dmx serial port?
    for (let x = 0; x < changedFixtures.length; x++) {
      changedFixtures[x].dmxUpdate();
    }
    this.emit('change', changes, oldValues);
  }

  getValue(channel: number): number;
  getValue(): number[];
  getValue(channel?: number): number | number[] | void {
    if (channel == undefined) return this._dmxArray.slice(0);
    if (!Number.isInteger(channel) || channel <= 0 || channel > 512) {
      if (channel != 0) console.error('Invalid DMX channel:' + channel);
      return;
    }
    return this._dmxArray[channel];
  }
}
export default Dmx;
