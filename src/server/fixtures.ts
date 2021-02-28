'use strict';
import ControlObject from './control-object';
import Group from './groups';
import Dmx from './dmx';
import definitions from './fixtureDefinitions';

let allFixtures = new Group('allFixtures');

class Fixture extends ControlObject {
  type: string;
  #dmxChannels: number[];
  _universe: Dmx;
  dmxUpdate: () => void;
  internals: number[];

  constructor(
    label: string,
    type: string,
    dmxChannels: number[],
    universe: Dmx,
    id?: string
  ) {
    super(id);
    this.label = label;
    this.type = type;
    if (type == 'dmx') type = 'basic';
    this._universe = universe;
    Object.defineProperty(this, 'id', { writable: false }); //id should never change
    if (
      Fixture.validateDmxArray(dmxChannels, universe) &&
      dmxChannels.length == definitions[type].dmx
    ) {
      this.#dmxChannels = dmxChannels;
      //addClaimed:
      for (let x = 0; x < definitions[type].dmx; x++) {
        if (this.#dmxChannels[x] != 0 && this.type != 'dmx')
          universe.claimed[this.#dmxChannels[x]] = {
            fixture: this,
            type: definitions[type].dmxLabel[x],
          };
      }
    } else this.#dmxChannels = new Array(definitions[type].dmx).fill(0);
    if (type == 'dmx') {
      this.dmxDirect = { channel: this.#dmxChannels[0], retrieveLabels: (channel) => {
        let rtn: labels = {label1: dmxChannels[0].toString()};
        let label2 = this._universe.claimed[this.#dmxChannels[0]].type
        if (label2 != '') rtn.label2 = label2;
        let label3 = this._universe.claimed[this.#dmxChannels[0]].fixture?.label
        if (label3 && label3 != '') rtn.label3 = label3;
        return rtn;
      }}
    }
    this.internals = definitions[type].internalsFromDMX(this.dmxArray);
    this.dmxUpdate = () => {
      this.internals = definitions[type].internalsFromDMX(this.dmxArray);
      this.refreshViewValues(0);
    };
    let elements: view['elements'] = [];
    for (let x = 0; x < definitions[type].properties.length; x++) {
      elements[x] = {
        setValue: (value) => {
          this.dmxArray = definitions[type].properties[x].set(this.internals, value);
        },
        getValue: () => {return definitions[type].properties[x].get(this.internals)},
        controlInterface: JSON.parse(JSON.stringify(definitions[type].properties[x].controlInterface)),
      };
    }
    this.views = [{ label: 'Properties', elements: elements }];
    this.refreshViewValues(0);
    if (this.type != 'dmx') allFixtures.addMember(this);
  }

  get dmxChannels() {
    return this.#dmxChannels.slice(0);
  }

  get dmxArray() {
    let rtn: number[] = [];
    for (let x = 0; x < this.#dmxChannels.length; x++) {
      if (this.#dmxChannels[x] != 0) {
        rtn.push(this._universe.getValue(this.#dmxChannels[x]));
      } else rtn.push(0);
    }
    return rtn;
  }

  set dmxArray(newDmxArray: number[]) {
    if (newDmxArray.length != this.#dmxChannels.length) {
      console.error('DMX array length mismatch');
      return
    }
    let dmxChanges: dmxChange[] = []
    for (let x = 0; x < this.#dmxChannels.length; x++) {
      dmxChanges.push({channel: this.#dmxChannels[x], value: newDmxArray[x]})
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

  static validateDmxArray(arr: number[], universe: Dmx) {
    let valid = true;
    for (let x = 0; x < arr.length; x++) {
      if (
        !Number.isInteger(arr[x]) ||
        arr[x] < 0 ||
        arr[x] > 512 ||
        universe.claimed[arr[x]].fixture != undefined
      )
        valid = false;
    }
    return valid;
  }
}

export default Fixture;

import { dmx } from './global';
let allDmx = new Group('allDmx');
for (let x = 1; x <= 255; x++) {
  allDmx.addMember(new Fixture(x.toString(), 'dmx', [x], dmx, x.toString()));
}
dmx.on('change', (changes) => {
  for (let x = 0; x < changes.length; x++) {
    let controlObject = ControlObject.getObjectById(changes[x].channel.toString())
    if (controlObject && controlObject.type == 'dmx') {
      let dmxFixture = controlObject as Fixture;
      dmxFixture.dmxUpdate();
    }
  }
})