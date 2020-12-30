'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDmxValuesUpdate = exports.processApiCmd = void 0;
const global_1 = __importDefault(require("./global"));
const fixtures_1 = __importDefault(require("./fixtures"));
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
        case 'dmxClaims':
            if (global_1.default.dmx) {
                let claimArray = [];
                for (let x = 0; x < global_1.default.dmx.claimed.length; x++) {
                    if (global_1.default.dmx.claimed[x].fixture != -1 &&
                        fixtures_1.default.getFixtureById(global_1.default.dmx.claimed[x].fixture)) {
                        claimArray[x] = {
                            fixtureLabel: fixtures_1.default.getFixtureById(global_1.default.dmx.claimed[x].fixture).label,
                            type: global_1.default.dmx.claimed[x].type,
                        };
                    }
                    else
                        claimArray[x] = null;
                }
                return {
                    type: 'dmxClaims',
                    data: claimArray,
                };
            }
            else
                return {
                    type: 'error',
                    data: 'DMX not initialized',
                };
            break;
        case 'fixtures':
            let valueArray = [];
            for (let x = 0; x < global_1.default.fixtures.length; x++) {
                valueArray[x] = global_1.default.fixtures[x].getValue();
            }
            return {
                type: 'fixtureValues',
                data: valueArray
            };
            break;
        case 'fixtureLabels':
            let labelArray = [];
            for (let x = 0; x < global_1.default.fixtures.length; x++) {
                labelArray[x] = global_1.default.fixtures[x].label;
            }
            return {
                type: 'fixtureLabels',
                data: labelArray
            };
            break;
        case 'setValue':
            switch (msg.type) {
                case 'dmx':
                    global_1.default.dmx.setValue(msg.number, msg.value);
                    break;
                case 'fixture':
                    global_1.default.fixtures[msg.number].setValue(msg.value, msg.valueName);
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
