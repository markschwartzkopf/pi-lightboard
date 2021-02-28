'use strict';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

let allControlObjects: { objects: ControlObject[]; readonly ids: string[] } = {
  objects: [],
  get ids() {
    return this.objects.map((x) => {
      return x.id;
    });
  },
};

declare interface ControlObject {
  memberIds: string[];
  views: view[];
  type: string;
  dmxDirect?: { channel: number; retrieveLabels: (channel: number) => labels }; //exception for 'dmx' type fixtures

  on(
    event: string, // view name, toString'd
    listener: viewListener
  ): this;
}

class ControlObject extends EventEmitter {
  label: string = '';
  id: string;

  constructor(id?: string) {
    super();
    if (id) {
      this.id = id;
    } else this.id = uuidv4();
    Object.defineProperty(this, 'id', { writable: false }); //id should never change
    if (id != 'adHoc') allControlObjects.objects.push(this); //adHoc is the only non-unique id
  }

  initId(): void {
    if (this.id == 'adHoc') {
      Object.defineProperty(this, 'id', { value: uuidv4() });
    } else console.error('Can only reinitialize ID of adHoc group');
  }

  getView(view: number): clientView {
    let rtn: clientView = {
      controls: this.views[view].elements.map((x) => {
        return x.controlInterface;
      }),
      id: this.id,
      view: view,
      label: this.label,
      views: this.views.map((x) => {
        return x.label;
      }),
    };
    let dmxDirect = this.dmxDirect;
    if (dmxDirect) {
      let labels = dmxDirect.retrieveLabels(dmxDirect.channel);
      delete rtn.controls[0].label1;
      delete rtn.controls[0].label2;
      delete rtn.controls[0].label3;
      rtn.controls[0] = { ...rtn.controls[0], ...labels };
    }
    return rtn;
  }

  refreshViewValues(view: number): void {
    let controlUpdates: { index: number; value: interfaceValue }[] = [];
    for (let x = 0; x < this.views[view].elements.length; x++) {
      let currentValue = this.views[0].elements[x].getValue();
      if (this.views[view].elements[x].controlInterface.value != currentValue) {
        this.views[view].elements[x].controlInterface.value = currentValue;
        controlUpdates.push({ index: x, value: currentValue });
      }
    }
    if (controlUpdates.length > 0) {
      let clientViewUpdate = { controls: controlUpdates, id: this.id, view: view }
      this.emit(view.toString(), 'update', clientViewUpdate);
    }
  }

  static getObjectById(id: string): ControlObject | null {
    let index = allControlObjects.ids.indexOf(id);
    if (index == -1) {
      console.error('no object with id: "' + id + '"');
      return null;
    } else return allControlObjects.objects[index];
  }

  static allControlObjects = allControlObjects;
}

export default ControlObject;
