'use strict';
export { myWebSocket };
import definitions from './fixtureDefinitions';
import { dmx, fixtures } from './global';
import * as api from './api';

// todo: switch to a more minimal html server
import express from 'express';
const app = express();
import WebSocket from 'ws';

interface myWebSocket extends WebSocket {
  isAlive: boolean;
  ip: string;
  _faders: serverFader[];
  removeSubscriptions: (() => void)[];
  selectedFixtures: { type: faderType; number: number }[];
  dmxValuesUpdate: (changes: dmxChange[]) => void;
  readonly clientFaders: faderData[];
  setValue: (index: number, value: number) => void;
  faderInit: (type: faderBank) => void;
}

app.use(express.static(__dirname + '/../public', { index: 'index.html' }));

const server = app.listen(80, () => console.log('Listening on port 80.'));

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: myWebSocket, req) => {
  //first implement myWebSocket interface... there has to be a better way to do this and have TypeScript allow properties to be added to ws
  ws.isAlive = true;
  ws.ip = 'no ip given';
  ws._faders = [];
  ws.removeSubscriptions = [];
  ws.selectedFixtures = [];
  ws.setValue = (index, value) => {
    setValue(index, value, ws._faders);
  };
  ws.faderInit = (x) => {
    faderInit(x, ws);
  };
  Object.defineProperty(ws, 'clientFaders', {
    get: (): faderData[] => {
      return ws._faders.map(
        (x): faderData => {
          switch (x.type) {
            case 'dmx':
              let xDmx = x as { type: 'dmx'; index: number };
              let index = xDmx.index;
              let fader: rangeFader = {
                type: 'range',
                min: 0,
                max: 255,
                step: 1,
                loop: false,
              };
              if (dmx.claimed[index].fixture) {
                fader.subLabel1 = dmx.claimed[index].type;
                fader.subLabel2 = dmx.claimed[index].fixture!.label;
              }
              return {
                fader: fader,
                value: dmx.getValue(index),
                label: index.toString(),
              };
              break;
            case 'fixture':
              return {
                fader: x.fixture.fader,
                value: x.fixture.getValue('value'),
                label: x.fixture.label,
              };
              break;
            case 'empty':
              console.error('code empty clientFader');
              return { fader: { type: 'empty' }, value: 0, label: '' };
          }
        }
      );
    },
  });
  if (req.socket.remoteAddress) {
    ws.ip = req.socket.remoteAddress.replace(/^.*:/, '');
  }
  console.log('Client connected: ' + ws.ip);
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  ws.on('message', (msg: string) => {
    let clientMsg: clientMsg;
    try {
      clientMsg = JSON.parse(msg);
      ws.send(JSON.stringify(api.processApiCmd(clientMsg, ws)));
    } catch (e) {
      console.error('Bad JSON from ' + ws.ip);
      console.log(msg);
      console.log(e);
    }
  });  
  ws.dmxValuesUpdate = (changes) => {
    let updates: faderUpdate[] = [];
    for (let x = 0; x < changes.length; x++) {
      for (let y = 0; y < ws._faders.length; y++) {
        let fader = ws._faders[y] as { type: 'dmx'; index: number };
        if (ws._faders[y].type == 'dmx' && fader.index == changes[x].channel) {
          updates.push({ index: y, value: changes[x].value });
        }
      }
    }
    if (updates.length > 0) {
      let updateMsg: serverMsg = { type: 'updateFaders', data: updates };
      ws.send(JSON.stringify(updateMsg));
    }
  };
  faderInit('dmx', ws);
  //dmx!.on('change', ws.dmxValuesUpdate);
  ws.on('close', () => {
    for (let x = 0; x < ws.removeSubscriptions.length; x++) {
      ws.removeSubscriptions[x]();
    }
    console.log('Connection properly closed for: ' + ws.ip);
  });
});

const beatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if ((<myWebSocket>ws).isAlive === false) {
      ws.terminate();
      console.log('closed dead connection for: ' + (<myWebSocket>ws).ip);
    }
    (<myWebSocket>ws).isAlive = false;
    ws.ping();
  });
}, 30000);

/* connectedClients = () => {
  let clients: string[] = [];
  wss.clients.forEach((ws) => {
    clients.push((<myWebSocket>ws).ip);
  });
  return clients;
}; */

wss.on('close', () => {
  clearInterval(beatInterval);
});

function faderInit(type: faderBank, ws: myWebSocket): void {
  for (let x = 0; x < ws.removeSubscriptions.length; x++) {
    ws.removeSubscriptions[x]();
  }
  dmx!.on('change', ws.dmxValuesUpdate);
  ws.removeSubscriptions[0] = () => {
    dmx!.removeListener('change', ws.dmxValuesUpdate);
  };
  ws._faders = [];
  switch (type) {
    case 'dmx':
      ws._faders = dmx
        .getValue()
        .slice(1)
        .map((x, index) => ({ type: 'dmx', index: index + 1 })); //slice(1) and +1 offset
      break;
    case 'fixtures':
      for (let x = 0; x < fixtures.all.length; x++) {
        ws._faders.push({ type: 'fixture', fixture: fixtures.all[x] });
        let xCopy = x;
        let fixtureChangeCallback = (
          changes: { valueName: string; value: number }[]
        ) => {
          for (let y = 0; y < changes.length; y++) {
            if (changes[y].valueName == 'value') {
              let updateMsg: serverMsg = {
                type: 'updateFaders',
                data: [{ index: xCopy, value: changes[y].value }],
              };
              ws.send(JSON.stringify(updateMsg));
            }
          }
        };
        fixtures.all[x].on('change', fixtureChangeCallback);
        ws.removeSubscriptions.push(() => {
          fixtures.all[x].removeListener('change', fixtureChangeCallback);
        });
      }
      break;
    default:
      console.error('code serverFader init type: ' + type);
      break;
  }
}

function setValue(index: number, value: number, faders: serverFader[]) {
  switch (faders[index].type) {
    case 'dmx':
      let dmxFader = faders[index] as { type: 'dmx'; index: number };
      dmx.setValues([{ channel: dmxFader.index, value: value }]);
      break;
    case 'fixture':
      let fixtureFader = faders[index] as {
        type: 'fixture';
        fixture: import('./fixtures').default;
      };
      fixtureFader.fixture.setValue(value);
      break;
    case 'empty':
      console.error('Cannot setValue for empty faders');
      break;
  }
}
