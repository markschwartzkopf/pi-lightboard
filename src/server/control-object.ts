import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export default class ControlObject extends EventEmitter {
  label = '';
  id: string;
  values: valuesType = {}; // needs variance measurements as well as value for each value type
  pushValues?: (...args: any[]) => void;
  pullValues?: (...args: any[]) => void;

  constructor(id?: string) {
    super();
    if (id) {
      this.id = id;
    } else this.id = uuidv4();
  }
  
  changeValue<K extends keyof valuesType>(valueName: K, newValue: valuesType[K]) {
    if (this.values.hasOwnProperty(valueName)) this.values[valueName] = newValue;
    if (this.pushValues) this.pushValues();
  }
}