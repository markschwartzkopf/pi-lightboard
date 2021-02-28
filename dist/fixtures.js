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
var _dmxChannels;
Object.defineProperty(exports, "__esModule", { value: true });
const control_object_1 = __importDefault(require("./control-object"));
const groups_1 = __importDefault(require("./groups"));
const fixtureDefinitions_1 = __importDefault(require("./fixtureDefinitions"));
let allFixtures = new groups_1.default('allFixtures');
class Fixture extends control_object_1.default {
    constructor(label, type, dmxChannels, universe, id) {
        super(id);
        _dmxChannels.set(this, void 0);
        this.label = label;
        this.type = type;
        if (type == 'dmx')
            type = 'basic';
        this._universe = universe;
        Object.defineProperty(this, 'id', { writable: false }); //id should never change
        if (Fixture.validateDmxArray(dmxChannels, universe) &&
            dmxChannels.length == fixtureDefinitions_1.default[type].dmx) {
            __classPrivateFieldSet(this, _dmxChannels, dmxChannels);
            //addClaimed:
            for (let x = 0; x < fixtureDefinitions_1.default[type].dmx; x++) {
                if (__classPrivateFieldGet(this, _dmxChannels)[x] != 0 && this.type != 'dmx')
                    universe.claimed[__classPrivateFieldGet(this, _dmxChannels)[x]] = {
                        fixture: this,
                        type: fixtureDefinitions_1.default[type].dmxLabel[x],
                    };
            }
        }
        else
            __classPrivateFieldSet(this, _dmxChannels, new Array(fixtureDefinitions_1.default[type].dmx).fill(0));
        if (type == 'dmx') {
            this.dmxDirect = { channel: __classPrivateFieldGet(this, _dmxChannels)[0], retrieveLabels: (channel) => {
                    let rtn = { label1: dmxChannels[0].toString() };
                    let label2 = this._universe.claimed[__classPrivateFieldGet(this, _dmxChannels)[0]].type;
                    if (label2 != '')
                        rtn.label2 = label2;
                    let label3 = this._universe.claimed[__classPrivateFieldGet(this, _dmxChannels)[0]].fixture?.label;
                    if (label3 && label3 != '')
                        rtn.label3 = label3;
                    return rtn;
                } };
        }
        this.internals = fixtureDefinitions_1.default[type].internalsFromDMX(this.dmxArray);
        this.dmxUpdate = () => {
            this.internals = fixtureDefinitions_1.default[type].internalsFromDMX(this.dmxArray);
            this.refreshViewValues(0);
        };
        let elements = [];
        for (let x = 0; x < fixtureDefinitions_1.default[type].properties.length; x++) {
            elements[x] = {
                setValue: (value) => {
                    this.dmxArray = fixtureDefinitions_1.default[type].properties[x].set(this.internals, value);
                },
                getValue: () => { return fixtureDefinitions_1.default[type].properties[x].get(this.internals); },
                controlInterface: JSON.parse(JSON.stringify(fixtureDefinitions_1.default[type].properties[x].controlInterface)),
            };
        }
        this.views = [{ label: 'Properties', elements: elements }];
        this.refreshViewValues(0);
        if (this.type != 'dmx')
            allFixtures.addMember(this);
    }
    get dmxChannels() {
        return __classPrivateFieldGet(this, _dmxChannels).slice(0);
    }
    get dmxArray() {
        let rtn = [];
        for (let x = 0; x < __classPrivateFieldGet(this, _dmxChannels).length; x++) {
            if (__classPrivateFieldGet(this, _dmxChannels)[x] != 0) {
                rtn.push(this._universe.getValue(__classPrivateFieldGet(this, _dmxChannels)[x]));
            }
            else
                rtn.push(0);
        }
        return rtn;
    }
    set dmxArray(newDmxArray) {
        if (newDmxArray.length != __classPrivateFieldGet(this, _dmxChannels).length) {
            console.error('DMX array length mismatch');
            return;
        }
        let dmxChanges = [];
        for (let x = 0; x < __classPrivateFieldGet(this, _dmxChannels).length; x++) {
            dmxChanges.push({ channel: __classPrivateFieldGet(this, _dmxChannels)[x], value: newDmxArray[x] });
        }
        this._universe.setValues(dmxChanges);
    }
    /* getValue(valueName: string): number;
    getValue(): { valueName: string; value: number }[];
    getValue(
      valueName?: string
    ): number | { valueName: string; value: number }[] {
      if (!valueName) {
        let rtn: { valueName: string; value: number }[] = [];
        for (let x = 0; x < definitions[this.type].dmx.length; x++) {
          rtn.push({
            valueName: definitions[this.type].dmx[x].subLabel1!,
            value: this.getValue(definitions[this.type].dmx[x].subLabel1!),
          });
        }
        if (definitions[this.type].indirect) {
          for (
            let x = 0;
            x < definitions[this.type].indirect!.properties.length;
            x++
          ) {
            rtn.push({
              valueName: definitions[this.type].indirect!.properties[x]
                .subLabel1!,
              value: this.getValue(
                definitions[this.type].indirect!.properties[x].subLabel1!
              ),
            });
          }
        }
        return rtn;
      }
      for (let x = 0; x < definitions[this.type].dmx.length; x++) {
        if (valueName == definitions[this.type].dmx[x].subLabel1!)
          return this._universe.getValue(this.#dmxChannels[x]);
      }
      if (definitions[this.type].indirect) {
        for (
          let x = 0;
          x < definitions[this.type].indirect!.properties.length;
          x++
        ) {
          if (
            valueName == definitions[this.type].indirect!.properties[x].subLabel1!
          ) {
            let dmxArray = this.#dmxChannels.map((n) =>
              this._universe.getValue(n)
            );
            return definitions[this.type].indirect!.get(dmxArray, valueName);
          }
        }
      }
      console.error('fixture.getValue error for: ' + valueName);
      return 0;
    } */
    /*  setValue(newVal: number, valueName?: string) {
      if (!valueName) valueName = 'value';
      for (let x = 0; x < definitions[this.type].dmx.length; x++) {
        if (valueName == definitions[this.type].dmx[x].subLabel1!) {
          this._universe.setValues(
            [{ channel: this.#dmxChannels[x], value: newVal }],
            -1,
            this.id
          );
          this.emit('change', [valueName], [newVal]);
          return;
        }
      }
      if (definitions[this.type].indirect) {
        for (
          let x = 0;
          x < definitions[this.type].indirect!.properties.length;
          x++
        ) {
          if (
            valueName == definitions[this.type].indirect!.properties[x].subLabel1!
          ) {
            let dmxArray = this.#dmxChannels.map((n) =>
              this._universe.getValue(n)
            );
            let dmxIndex = this.#dmxChannels;
            this._universe.setValues(
              definitions[this.type]
                .indirect!.set(dmxArray, valueName, newVal)
                .map((val, index) => ({ channel: dmxIndex[index], value: val })),
              -1,
              this.id
            );
            this.emit('change', [{ valueName: valueName, value: newVal }]);
            return;
          }
        }
      }
      console.error('No such property ' + valueName + ' on fixture');
    } */
    /*  fader(valueName?: string): fader {
      if (!valueName) valueName = 'value';
      let rtnFader: fader | undefined = undefined;
      for (let x = 0; x < definitions[this.type].dmx.length; x++) {
        if (definitions[this.type].dmx[x].subLabel1 == valueName) {
          rtnFader = JSON.parse(
            JSON.stringify(definitions[this.type].dmx[x])
          ) as fader;
          delete rtnFader.subLabel1;
        }
      }
      if (!rtnFader && definitions[this.type].indirect) {
        for (
          let x = 0;
          x < definitions[this.type].indirect!.properties.length;
          x++
        ) {
          if (
            definitions[this.type].indirect!.properties[x].subLabel1 == valueName
          ) {
            rtnFader = JSON.parse(
              JSON.stringify(definitions[this.type].indirect!.properties[x])
            ) as fader;
            delete rtnFader.subLabel1;
          }
        }
      }
      if (rtnFader == undefined) rtnFader = { type: 'empty' };
      return rtnFader;
    } */
    static validateDmxArray(arr, universe) {
        let valid = true;
        for (let x = 0; x < arr.length; x++) {
            if (!Number.isInteger(arr[x]) ||
                arr[x] < 0 ||
                arr[x] > 512 ||
                universe.claimed[arr[x]].fixture != undefined)
                valid = false;
        }
        return valid;
    }
}
_dmxChannels = new WeakMap();
exports.default = Fixture;
const global_1 = require("./global");
let allDmx = new groups_1.default('allDmx');
for (let x = 1; x <= 255; x++) {
    allDmx.addMember(new Fixture(x.toString(), 'dmx', [x], global_1.dmx, x.toString()));
}
global_1.dmx.on('change', (changes) => {
    for (let x = 0; x < changes.length; x++) {
        let controlObject = control_object_1.default.getObjectById(changes[x].channel.toString());
        if (controlObject && controlObject.type == 'dmx') {
            let dmxFixture = controlObject;
            dmxFixture.dmxUpdate();
        }
    }
});
