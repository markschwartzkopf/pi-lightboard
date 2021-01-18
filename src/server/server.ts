'use strict';
export {};
/* import globalObj from './global'; */
/* let {dmx} = require('./global') as {dmx: Dmx, fixtures: Fixture[]} */
import { dmx } from './global'
import * as api from './api';

// todo: switch to a more minimal html server
import express from 'express';
const app = express();
import WebSocket from 'ws';


class myWebSocket extends WebSocket {
  isAlive: boolean = true;
  ip: string = 'no ip given';
  faders: fader[] = [];
  redrawFadersJSON: {new: string, old: string} = {new: '', old: ''};
  updateFadersJSON: {new: string, old: string} = {new: '', old: ''};
  selectedFixtures: {type: faderType, number: number}[] = [];
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
    let clientMsg: clientMsg
    try {
      clientMsg = JSON.parse(msg)
      ws.send(JSON.stringify(api.processApiCmd(clientMsg)));
    } catch (e) {
      console.error('Bad JSON from ' + ws.ip);
      console.log(msg)
      console.log(e)
    }
  });
  ws.dmxValuesUpdate = (dmxValues) => {
    ws.send(JSON.stringify(api.processDmxValuesUpdate(dmxValues)));
    ws.send(JSON.stringify(api.processApiCmd({command: 'fixtures'})));
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
