'use strict';
import Dmx from './dmx';
/* import type Fixture from './fixtures'
import { EventEmitter } from 'events';
 */

/* declare interface myEvent {
  on(event: 'broadcast', listener: (msg: serverMsg) => void): this;
} */

export let dmx: Dmx
//export let fixtures: {all: Fixture[]}
dmx = new Dmx();
//fixtures = {all: []};
