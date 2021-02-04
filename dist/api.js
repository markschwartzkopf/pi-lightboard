'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processApiCmd = void 0;
function processApiCmd(msg, ws) {
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
                data: 'Command acknowledged',
            };
            break;
        case 'setFaderBank':
            ws.faderInit(msg.bank);
            return {
                type: 'drawFaders',
                data: ws.clientFaders,
            };
            break;
        case 'select':
            let { command, ...selectCommand } = msg;
            ws.select(selectCommand);
            //console.log(msg.number + ' ' + msg.operation + ' reset: ' + msg.reset);
            return {
                type: 'info',
                data: 'Command acknowledged',
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
