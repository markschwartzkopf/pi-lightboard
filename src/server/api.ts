'use strict';
export { processApiCmd, processDmxValuesUpdate };
import { dmx, fixtures } from './global';
import Fixture from './fixtures';

function processApiCmd(msg: clientMsg): serverMsg {
  switch (msg.command) {
    case 'init':
      console.log('init cmd received')
      return {
        type: 'info',
        data: 'Init command received',
      };
      break;
    case 'dmx':
      if (dmx) {
        return {
          type: 'dmxValues',
          data: dmx.getValue(),
        };
      } else
        return {
          type: 'error',
          data: 'DMX not initialized',
        };
      break;
    case 'dmxClaims':
      if (dmx) {
        let claimArray: dmxClaimToClient[] = [];
        for (let x = 0; x < dmx.claimed.length; x++) {
          if (
            dmx.claimed[x].fixture != -1 &&
            Fixture.getFixtureById(dmx.claimed[x].fixture)
          ) {
            claimArray[x] = {
              fixtureLabel: Fixture.getFixtureById(
                dmx.claimed[x].fixture
              )!.label,
              type: dmx.claimed[x].type,
            };
          } else claimArray[x] = null;
        }
        return {
          type: 'dmxClaims',
          data: claimArray,
        };
      } else
        return {
          type: 'error',
          data: 'DMX not initialized',
        };
      break;
    case 'fixtures':
      let valueArray: fixtureProperties[] = [];
      for (let x = 0; x < fixtures.all.length; x++){
        valueArray[x] = fixtures.all[x].getValue();
      }
      return {
        type: 'fixtureValues',
        data: valueArray
      }
      break;
    case 'fixtureLabels':
      let labelArray: string[] = [];
      for (let x = 0; x < fixtures.all.length; x++){
        labelArray[x] = fixtures.all[x].label
      }
      return {
        type: 'fixtureLabels',
        data: labelArray
      }
      break;
    case 'setValue':
      switch (msg.type) {
        case 'dmx':
          dmx.setValues([msg.number], [msg.value]);
          break;
        case 'fixture':
          fixtures.all[msg.number].setValue(msg.value, msg.valueName);
          break;
      }
      return {
        type: 'info',
        data: 'Command acknowleged',
      };
      break;
    case 'getFixture':
      let rtnData = fixtures.all[msg.number].getValue()
      rtnData.fixture = msg.number;
      return {
        type: 'fixtureProperties',
        data: rtnData,
      };
      break;
    default:
      console.error('Received bad command: ' + msg)
      return {
        type: 'info',
        data: 'Invalid command received',
      };
  }
}

function processDmxValuesUpdate(dmxValues: number[]): serverMsg {
  return { type: 'dmxValues', data: dmxValues };
}
