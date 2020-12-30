'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const dmx_1 = __importDefault(require("./dmx"));
class myEvent extends events_1.EventEmitter {
    constructor() {
        super();
    }
}
let globalObj = {
    event: new myEvent(),
    is: function (m, ...args) {
        if (typeof globalObj[m] === 'function') {
            return globalObj[m](...args);
        }
        else {
            return console.error('Global function "' + m + '" does not exist');
        }
    },
    dmx: new dmx_1.default(),
    fixtures: []
};
exports.default = globalObj;
