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

  getValue(valueName?: string): number {
    if (!valueName) valueName = 'value';
    let dmxIndex = definitions[this.type].dmx.indexOf(<channelType>valueName);
    if (valueName && dmxIndex != -1) {
      return this._universe.getValue(this.#dmxChannels[dmxIndex]);
    }
    if (definitions[this.type].indirect) {
      let indirectIndex = definitions[this.type].indirect!.names.indexOf(
        valueName
      );
      let dmxArray = this.#dmxChannels.map((n) => this._universe.getValue(n));
      if (indirectIndex != -1)
        return definitions[this.type].indirect!.get(dmxArray, valueName);
    }
    return 0;
  }

  setValue(newVal: number, valueName?: string) {
    if (!valueName) valueName = 'value';
    let dmxIndex = definitions[this.type].dmx.indexOf(<channelType>valueName);
    if (valueName && dmxIndex != -1) {
      this._universe.setValue(this.#dmxChannels[dmxIndex], newVal);
      return;
    }
    if (definitions[this.type].indirect) {
      let indirectIndex = definitions[this.type].indirect!.names.indexOf(
        valueName
      );
      let dmxArray = this.#dmxChannels.map((n) => this._universe.getValue(n));
      if (indirectIndex != -1) {
        definitions[this.type].indirect!.set(dmxArray, valueName, newVal);
        return;
      }
    }
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
