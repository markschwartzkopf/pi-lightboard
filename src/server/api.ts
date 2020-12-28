'use strict';
export { processApiCmd, processDmxValuesUpdate };
import globalObj from './global';

function processApiCmd(msg: clientMsg): serverMsg {
  switch (msg.command) {
    case 'dmx':
      if (globalObj.dmx) {
        return {
          type: 'dmxValues',
          data: globalObj.dmx!.getValue(),
        };
      } else
        return {
          type: 'error',
          data: 'DMX not initialized',
        };
      break;
    case 'setValue':
      switch (msg.type) {
        case 'dmx':
          if (globalObj.dmx) {
            globalObj.dmx.setValue(msg.number, (msg.value));
          }
          break;
        case 'fixture':
          break;
      }
      return {
        type: 'info',
        data: 'Command acknowleged',
      };
      break;
    default:
      return {
        type: 'info',
        data: 'Invalid command received',
      };
  }
}

function processDmxValuesUpdate(dmxValues: number[]): serverMsg {
  return { type: 'dmxValues', data: dmxValues };
}
