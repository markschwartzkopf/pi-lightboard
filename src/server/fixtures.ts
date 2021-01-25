'use strict';
import { EventEmitter } from 'events';
import Dmx from './dmx';
import definitions from './fixtureDefinitions';

let nextId = 0;
let allFixturesEver: Fixture[] = [];

class Fixture extends EventEmitter {
  label: string;
  type: fixtureType;
  #dmxChannels: number[];
  _universe: Dmx;
  readonly #id: number;

  constructor(
    label: string,
    type: fixtureType,
    dmxChannels: number[],
    universe: Dmx
  ) {
    super();
    this.label = label;
    this.type = type;
    this._universe = universe;
    this.#id = nextId;
    nextId++;
    if (
      Fixture.validateDmxArray(dmxChannels, universe) &&
      dmxChannels.length == definitions[type].dmx.length
    ) {
      this.#dmxChannels = dmxChannels;
      //addClaimed
      for (let x = 0; x < definitions[type].dmx.length; x++) {
        if (this.#dmxChannels[x] != 0)
          universe.claimed[this.#dmxChannels[x]] = {
            fixture: this.#id,
            type: definitions[type].dmx[x],
          };
      }
    } else this.#dmxChannels = new Array(definitions[type].dmx.length).fill(0);
    allFixturesEver[this.#id] = this;
  }

  get dmxChannels() {
    return this.#dmxChannels.slice(0);
  }

  getValue(valueName: string): number;
  getValue(): number[];
  getValue(valueName?: string): number | number[] {
    if (!valueName) {
      let rtn: number[] = [];
      for (let x = 0; x < definitions[this.type].dmx.length; x++) {
        rtn.push(this.getValue(definitions[this.type].dmx[x].subLabel1!));
      }
      if (definitions[this.type].indirect) {
        for (
          let x = 0;
          x < definitions[this.type].indirect!.properties.length;
          x++
        ) {
          rtn.push(
            this.getValue(
              definitions[this.type].indirect!.properties[x].subLabel1!
            )
          );
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
  }

  setValue(newVal: number, valueName?: string) {
    if (!valueName) valueName = 'value';

    for (let x = 0; x < definitions[this.type].dmx.length; x++) {
      if (valueName == definitions[this.type].dmx[x].subLabel1!)
        this._universe.setValues([this.#dmxChannels[x]], [newVal]);
      return;
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
            dmxIndex,
            definitions[this.type].indirect!.set(dmxArray, valueName, newVal)
          );
          return;
        }
      }
    }
    console.error('No such property ' + valueName + ' on fixture');
  }

  get fader(): fader {
    let rtnFader: fader | undefined = undefined;
    for (let x = 0; x < definitions[this.type].dmx.length; x++) {
      if (definitions[this.type].dmx[x].subLabel1 == 'value') {
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
          definitions[this.type].indirect!.properties[x].subLabel1 == 'value'
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
  }

  static validateDmxArray(arr: any[], universe?: Dmx) {
    let valid = true;
    if (Array.isArray(arr)) {
      for (let x = 0; x < arr.length; x++) {
        if (
          typeof arr[x] != 'number' ||
          !Number.isInteger(arr[x]) ||
          arr[x] < 0 ||
          arr[x] > 512 ||
          (universe && universe.claimed[arr[x]].fixture != -1)
        )
          valid = false;
      }
    } else valid = false;
    return valid;
  }

  static getFixtureById(id: number): Fixture | undefined {
    return allFixturesEver[id];
  }
}

export default Fixture;
