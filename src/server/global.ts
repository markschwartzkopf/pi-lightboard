'use strict';
import { EventEmitter } from 'events';
import Dmx from './dmx';
import Fixture from './fixtures'

declare interface myEvent {
  on(event: 'broadcast', listener: (msg: serverMsg) => void): this;
}

class myEvent extends EventEmitter {
  constructor() {
    super();
  }
}

declare interface globalObj {
  [key: string]: any;
  event: myEvent;
  is: <T extends any[]>(m: string, ...args: T) => (...args: T) => any;
  dmx: Dmx;
  fixtures: Fixture[];
}

let globalObj: globalObj = {
  event: new myEvent(),
  is: function (m, ...args) {
    if (typeof globalObj[m] === 'function') {
      return globalObj[m](...args);
    } else {
      return console.error('Global function "' + m + '" does not exist');
    }
  },
  dmx: new Dmx(),
  fixtures: []
};

export default globalObj;

