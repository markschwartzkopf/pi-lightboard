"use strict";
/* --r1: 255;
        --g1: 214;
        --b1: 170;
        --r2: 201;
        --g2: 226;
        --b2: 255;
        --r3: 255;
        --g3: 147;
        --b3: 41; */
Object.defineProperty(exports, "__esModule", { value: true });
/* import basicRGB from './fixtureDefinitions/basicRGB'; */
const definitions = {
    basic: {
        dmx: 1,
        dmxLabel: ['value'],
        dmxLock: [false],
        internalsFromDMX: (dmx) => {
            return [dmx[0] / 255];
        },
        properties: [
            {
                controlInterface: { label2: 'value', type: 'range', value: 0 },
                set: (internals, newVal) => {
                    if (typeof newVal == 'number' && newVal >= 0 && newVal <= 1) {
                        internals[0] = newVal;
                        return [newVal * 255];
                    }
                    else
                        return [-1];
                },
                get: (internals) => {
                    return internals[0];
                },
            },
        ],
    },
};
//definitions.dmx = 
exports.default = definitions;
