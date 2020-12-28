interface globalObj {
  [key: string]: any;
  event: import('events').EventEmitter;
  is: <T extends any[]>(m: string, ...args: T) => (...args: T) => any;
  dmx?: import('../../server/dmx').default;
}
