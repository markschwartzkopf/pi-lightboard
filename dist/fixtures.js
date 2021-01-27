'use strict';
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _dmxChannels, _id;
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const fixtureDefinitions_1 = __importDefault(require("./fixtureDefinitions"));
let nextId = 0;
let allFixturesEver = [];
class Fixture extends events_1.EventEmitter {
    constructor(label, type, dmxChannels, universe) {
        super();
        _dmxChannels.set(this, void 0);
        _id.set(this, void 0);
        this.label = label;
        this.type = type;
        this._universe = universe;
        __classPrivateFieldSet(this, _id, nextId);
        nextId++;
        if (Fixture.validateDmxArray(dmxChannels, universe) &&
            dmxChannels.length == fixtureDefinitions_1.default[type].dmx.length) {
            __classPrivateFieldSet(this, _dmxChannels, dmxChannels);
            //addClaimed
            for (let x = 0; x < fixtureDefinitions_1.default[type].dmx.length; x++) {
                if (__classPrivateFieldGet(this, _dmxChannels)[x] != 0)
                    universe.claimed[__classPrivateFieldGet(this, _dmxChannels)[x]] = {
                        fixture: __classPrivateFieldGet(this, _id),
                        type: fixtureDefinitions_1.default[type].dmx[x],
                    };
            }
        }
        else
            __classPrivateFieldSet(this, _dmxChannels, new Array(fixtureDefinitions_1.default[type].dmx.length).fill(0));
        allFixturesEver[__classPrivateFieldGet(this, _id)] = this;
    }
    get dmxChannels() {
        return __classPrivateFieldGet(this, _dmxChannels).slice(0);
    }
    getValue(valueName) {
        if (!valueName) {
            let rtn = [];
            for (let x = 0; x < fixtureDefinitions_1.default[this.type].dmx.length; x++) {
                rtn.push(this.getValue(fixtureDefinitions_1.default[this.type].dmx[x].subLabel1));
            }
            if (fixtureDefinitions_1.default[this.type].indirect) {
                for (let x = 0; x < fixtureDefinitions_1.default[this.type].indirect.properties.length; x++) {
                    rtn.push(this.getValue(fixtureDefinitions_1.default[this.type].indirect.properties[x].subLabel1));
                }
            }
            return rtn;
        }
        for (let x = 0; x < fixtureDefinitions_1.default[this.type].dmx.length; x++) {
            if (valueName == fixtureDefinitions_1.default[this.type].dmx[x].subLabel1)
                return this._universe.getValue(__classPrivateFieldGet(this, _dmxChannels)[x]);
        }
        if (fixtureDefinitions_1.default[this.type].indirect) {
            for (let x = 0; x < fixtureDefinitions_1.default[this.type].indirect.properties.length; x++) {
                if (valueName == fixtureDefinitions_1.default[this.type].indirect.properties[x].subLabel1) {
                    let dmxArray = __classPrivateFieldGet(this, _dmxChannels).map((n) => this._universe.getValue(n));
                    return fixtureDefinitions_1.default[this.type].indirect.get(dmxArray, valueName);
                }
            }
        }
        console.error('fixture.getValue error for: ' + valueName);
        return 0;
    }
    setValue(newVal, valueName) {
        if (!valueName)
            valueName = 'value';
        for (let x = 0; x < fixtureDefinitions_1.default[this.type].dmx.length; x++) {
            if (valueName == fixtureDefinitions_1.default[this.type].dmx[x].subLabel1) {
                this._universe.setValues([
                    { channel: __classPrivateFieldGet(this, _dmxChannels)[x], value: newVal },
                ]);
                return;
            }
        }
        if (fixtureDefinitions_1.default[this.type].indirect) {
            for (let x = 0; x < fixtureDefinitions_1.default[this.type].indirect.properties.length; x++) {
                console.log('indirect ' +
                    fixtureDefinitions_1.default[this.type].indirect.properties[x].subLabel1 +
                    ' compareed to ' +
                    valueName);
                if (valueName == fixtureDefinitions_1.default[this.type].indirect.properties[x].subLabel1) {
                    console.log(newVal);
                    let dmxArray = __classPrivateFieldGet(this, _dmxChannels).map((n) => this._universe.getValue(n));
                    let dmxIndex = __classPrivateFieldGet(this, _dmxChannels);
                    console.log(fixtureDefinitions_1.default[this.type]
                        .indirect.set(dmxArray, valueName, newVal)
                        .map((val, index) => ({ channel: dmxIndex[index], value: val })));
                    this._universe.setValues(fixtureDefinitions_1.default[this.type]
                        .indirect.set(dmxArray, valueName, newVal)
                        .map((val, index) => ({ channel: dmxIndex[index], value: val })));
                    return;
                }
            }
        }
        console.error('No such property ' + valueName + ' on fixture');
    }
    get fader() {
        let rtnFader = undefined;
        for (let x = 0; x < fixtureDefinitions_1.default[this.type].dmx.length; x++) {
            if (fixtureDefinitions_1.default[this.type].dmx[x].subLabel1 == 'value') {
                rtnFader = JSON.parse(JSON.stringify(fixtureDefinitions_1.default[this.type].dmx[x]));
                delete rtnFader.subLabel1;
            }
        }
        if (!rtnFader && fixtureDefinitions_1.default[this.type].indirect) {
            for (let x = 0; x < fixtureDefinitions_1.default[this.type].indirect.properties.length; x++) {
                if (fixtureDefinitions_1.default[this.type].indirect.properties[x].subLabel1 == 'value') {
                    rtnFader = JSON.parse(JSON.stringify(fixtureDefinitions_1.default[this.type].indirect.properties[x]));
                    delete rtnFader.subLabel1;
                }
            }
        }
        if (rtnFader == undefined)
            rtnFader = { type: 'empty' };
        return rtnFader;
    }
    static validateDmxArray(arr, universe) {
        let valid = true;
        if (Array.isArray(arr)) {
            for (let x = 0; x < arr.length; x++) {
                if (typeof arr[x] != 'number' ||
                    !Number.isInteger(arr[x]) ||
                    arr[x] < 0 ||
                    arr[x] > 512 ||
                    (universe && universe.claimed[arr[x]].fixture != -1))
                    valid = false;
            }
        }
        else
            valid = false;
        return valid;
    }
    static getFixtureById(id) {
        return allFixturesEver[id];
    }
}
_dmxChannels = new WeakMap(), _id = new WeakMap();
exports.default = Fixture;
