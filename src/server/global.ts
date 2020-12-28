'use strict';
import { EventEmitter } from 'events';
import Dmx from './dmx';

let globalObj: globalObj = {
  event: new EventEmitter(),
  is: function (m, ...args) {
    if (typeof globalObj[m] === 'function') {
      return globalObj[m](...args);
    } else {
      return console.error('Global function "' + m + '" does not exist');
    }
  },
};

export default globalObj;
