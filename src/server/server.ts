'use strict';
export { myWebSocket };
import definitions from './fixtureDefinitions';
import { dmx, fixtures } from './global';
import * as api from './api';

// todo: switch to a more minimal html server
import express from 'express';
const app = express();
import WebSocket from 'ws';

class myWebSocket extends WebSocket {
  isAlive: boolean = true;
  ip: string = 'no ip given';
  faders: faderData[] = [];
  redrawFadersJSON: { new: string; old: string } = { new: '', old: '' };
  updateFadersJSON: { new: string; old: string } = { new: '', old: '' };
  selectedFixtures: { type: faderType; number: number }[] = [];
  dmxValuesUpdate?: (dmxValues: number[]) => void;
}

app.use(express.static(__dirname + '/../public', { index: 'index.html' }));

const server = app.listen(80, () => console.log('Listening on port 80.'));

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: myWebSocket, req) => {
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
  ws.faders = faderInit('fixture');
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

function faderInit(
  type: faderType
): faderData[] {
  let rtn: faderData[] = [];
  switch (type) {
    case 'dmx':
      break;
    case 'fixture':
      for (let x = 0; x < fixtures.all.length; x++) {
        let fader: fader | undefined = undefined;
        for (let y = 0; y < definitions[fixtures.all[x].type].dmx.length; y++) {
          if (definitions[fixtures.all[x].type].dmx[y].subLabel1 == 'value') {
            fader = JSON.parse(JSON.stringify(definitions[fixtures.all[x].type].dmx[y])) as fader;
            delete fader.subLabel1;
          }
        }
        if (!fader && definitions[fixtures.all[x].type].indirect) {
          for (
            let y = 0;
            y < definitions[fixtures.all[x].type].indirect!.properties.length;
            y++
          ) {
            if (
              definitions[fixtures.all[x].type].indirect!.properties[y]
                .subLabel1 == 'value'
            ) {
              fader = JSON.parse(JSON.stringify(definitions[fixtures.all[x].type].indirect!.properties[y])) as fader;
              delete fader.subLabel1;
            }
          }
        }
        if (fader == undefined) fader = {type: 'empty'};
        rtn.push({
          fader: fader,
          value: fixtures.all[x].getValue('value'),
          label: fixtures.all[x].label,
        });
      }
      break;
    case 'fixtureProperty':
      break;
  }
  return rtn;
}
