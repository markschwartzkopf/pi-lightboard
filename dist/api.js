'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDmxValuesUpdate = exports.processApiCmd = void 0;
const global_1 = __importDefault(require("./global"));
function processApiCmd(msg) {
    switch (msg.command) {
        case 'dmx':
            if (global_1.default.dmx) {
                return {
                    type: 'dmxValues',
                    data: global_1.default.dmx.getValue(),
                };
            }
            else
                return {
                    type: 'error',
                    data: 'DMX not initialized',
                };
            break;
        case 'setValue':
            switch (msg.type) {
                case 'dmx':
                    if (global_1.default.dmx) {
                        global_1.default.dmx.setValue(msg.number, (msg.value));
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
exports.processApiCmd = processApiCmd;
function processDmxValuesUpdate(dmxValues) {
    return { type: 'dmxValues', data: dmxValues };
}
exports.processDmxValuesUpdate = processDmxValuesUpdate;
