/* interface myEvent extends import('events').EventEmitter {
  on(event: 'broadcast', listener: (msg: serverMsg) => void): this;
}
 */
/* interface globalObj {
  [key: string]: any;
  event: myEvent;
  is: <T extends any[]>(m: string, ...args: T) => (...args: T) => any;
  dmx: import('../../server/dmx').default;
  fixtures: import('../../server/fixtures').default[];
} */

type fixtureInit = { label: string, type: fixtureType, dmx: number[]}

type channelType = 'value' | 'red' | 'green' | 'blue'
