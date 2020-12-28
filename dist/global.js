'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
let globalObj = {
    event: new events_1.EventEmitter(),
    is: function (m, ...args) {
        if (typeof globalObj[m] === 'function') {
            return globalObj[m](...args);
        }
        else {
            return console.error('Global function "' + m + '" does not exist');
        }
    },
};
exports.default = globalObj;
