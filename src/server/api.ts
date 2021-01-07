'use strict';
export { processApiCmd, processDmxValuesUpdate };
import globalObj from './global';
import Fixture from './fixtures';

function processApiCmd(msg: clientMsg): serverMsg {
  switch (msg.command) {
    case 'dmx':
      if (globalObj.dmx) {
        return {
          type: 'dmxValues',
          data: globalObj.dmx.getValue(),
        };
      } else
        return {
          type: 'error',
          data: 'DMX not initialized',
        };
      break;
    case 'dmxClaims':
      if (globalObj.dmx) {
        let claimArray: dmxClaimToClient[] = [];
        for (let x = 0; x < globalObj.dmx.claimed.length; x++) {
          if (
            globalObj.dmx.claimed[x].fixture != -1 &&
            Fixture.getFixtureById(globalObj.dmx.claimed[x].fixture)
          ) {
            claimArray[x] = {
              fixtureLabel: Fixture.getFixtureById(
                globalObj.dmx.claimed[x].fixture
              )!.label,
              type: globalObj.dmx.claimed[x].type,
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
      for (let x = 0; x < globalObj.fixtures.length; x++){
        valueArray[x] = globalObj.fixtures[x].getValue();
      }
      return {
        type: 'fixtureValues',
        data: valueArray
      }
      break;
    case 'fixtureLabels':
      let labelArray: string[] = [];
      for (let x = 0; x < globalObj.fixtures.length; x++){
        labelArray[x] = globalObj.fixtures[x].label
      }
      return {
        type: 'fixtureLabels',
        data: labelArray
      }
      break;
    case 'setValue':
      switch (msg.type) {
        case 'dmx':
          globalObj.dmx.setValues([msg.number], [msg.value]);
          break;
        case 'fixture':
          globalObj.fixtures[msg.number].setValue(msg.value, msg.valueName);
          break;
      }
      return {
        type: 'info',
        data: 'Command acknowleged',
      };
      break;
    case 'getFixture':
      let rtnData = globalObj.fixtures[msg.number].getValue()
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
