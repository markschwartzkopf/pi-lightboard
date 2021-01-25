'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDmxValuesUpdate = exports.processApiCmd = void 0;
function processApiCmd(msg, ws) {
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
exports.processApiCmd = processApiCmd;
function processDmxValuesUpdate(dmxValues) {
    return { type: 'dmxValues', data: dmxValues };
}
exports.processDmxValuesUpdate = processDmxValuesUpdate;
