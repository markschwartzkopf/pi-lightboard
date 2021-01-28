'use strict';
import { EventEmitter } from 'events';
import Dmx from './dmx';
import definitions from './fixtureDefinitions';

declare interface Fixture {
  on(
    event: 'change',
    listener: (changes: { valueName: string; value: number }[]) => void
  ): this;
}

let nextId = 0;

class Fixture extends EventEmitter {
  label: string;
  type: fixtureType;
  #dmxChannels: number[];
  _universe: Dmx;
  readonly id: number;

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
    this.id = nextId;
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
            fixture: this,
            type: definitions[type].dmx[x].subLabel1!,
          };
      }
    } else this.#dmxChannels = new Array(definitions[type].dmx.length).fill(0);
  }

  get dmxChannels() {
    return this.#dmxChannels.slice(0);
  }

  dmxUpdate() {
    this.emit('change', this.getValue());
  }

  getValue(valueName: string): number;
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
            valueName: definitions[this.type].indirect!.properties[x].subLabel1!,
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
  }

  setValue(newVal: number, valueName?: string) {
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
          (universe && universe.claimed[arr[x]].fixture != undefined)
        )
          valid = false;
      }
    } else valid = false;
    return valid;
  }
}

export default Fixture;
