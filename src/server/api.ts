'use strict';
export { processApiCmd };
import { dmx, fixtures } from './global';
import Fixture from './fixtures';
import { myWebSocket } from './server';

function processApiCmd(msg: clientMsg, ws: myWebSocket): serverMsg {
  switch (msg.command) {
    case 'init':
      return {
        type: 'drawFaders',
        data: ws.clientFaders,
      };
      break;
    case 'setValue':
      ws.setValue(msg.index, msg.value);
      return {
        type: 'info',
        data: 'Command acknowleged',
      };
      break;
    case 'setFaderBank':
      ws.faderInit(msg.bank);
      return {
        type: 'drawFaders',
        data: ws.clientFaders,
      };
      break;
    default:
      console.error('Received bad command: ' + msg);
      return {
        type: 'info',
        data: 'Invalid command received',
      };
  }
}
