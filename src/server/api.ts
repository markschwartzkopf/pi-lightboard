'use strict';
export { processApiCmd, processDmxValuesUpdate };
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
      /* switch (msg.type) {
        case 'dmx':
          dmx.setValues([msg.number], [msg.value]);
          break;
        case 'fixture':
          fixtures.all[msg.number].setValue(msg.value, msg.valueName);
          break;
      } */
      return {
        type: 'info',
        data: 'Command acknowleged',
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

function processDmxValuesUpdate(dmxValues: number[]): serverMsg {
  return { type: 'dmxValues', data: dmxValues };
}
