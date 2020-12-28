'use strict';
import('./server');
//import('./api');

import globalObj from './global'
import Dmx from './dmx';
globalObj.dmx = new Dmx;
//testing code:

//console.log(globalObj.dmx.dmxArray)
/* import globalObj from './global';
setInterval(() => {
  console.log(globalObj.is('connectedClients'));
}, 5000); */



