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
  redrawFadersJSON: { new: string; old: string };
  updateFadersJSON: { new: string; old: string };
  selectedFixtures: { type: faderType; number: number }[];
  dmxValuesUpdate?: (dmxValues: number[]) => void;
  readonly clientFaders: faderData[];
}

app.use(express.static(__dirname + '/../public', { index: 'index.html' }));

const server = app.listen(80, () => console.log('Listening on port 80.'));

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: myWebSocket, req) => {
  //first implement myWebSocket interface... there has to be a better way to do this and have TypeScript allow properties to be added to ws
  ws.isAlive = true;
  ws.ip = 'no ip given';
  ws._faders = [];
  ws.redrawFadersJSON = { new: '', old: '' };
  ws.updateFadersJSON = { new: '', old: '' };
  ws.selectedFixtures = [];
  Object.defineProperty(ws, 'clientFaders', {
    get: (): faderData[] => {
      return ws._faders.map(
        (x): faderData => {
          switch (x.type) {
            case 'dmx':
              console.error('code dmx clientFader');
              return { fader: { type: 'empty' }, value: 0, label: '' };
              break;
            case 'fixture':
              return {
                fader: x.fixture.fader,
                value: x.fixture.getValue('value'),
                label: x.fixture.label,
              } as faderData;
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
  ws._faders = faderInit('fixture');
  ws.dmxValuesUpdate = (dmxValues) => {
    /* ws.send(JSON.stringify(api.processDmxValuesUpdate(dmxValues)));
    ws.send(JSON.stringify(api.processApiCmd({command: 'fixtures'}))); */
  };
  dmx!.on('change', ws.dmxValuesUpdate);
  ws.on('close', () => {
    dmx!.removeListener('change', ws.dmxValuesUpdate!);
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

function faderInit(type: faderType): serverFader[] {
  let rtn: serverFader[] = [];
  switch (type) {
    case 'dmx':
      console.error('code dmx serverFader init');
      break;
    case 'fixture':
      rtn = fixtures.all.map(
        (x): serverFader => ({ type: 'fixture', fixture: x })
      );
      break;
    case 'fixtureProperty':
      console.error('code fixtureProperty serverFader init');
      break;
  }
  return rtn;
}
