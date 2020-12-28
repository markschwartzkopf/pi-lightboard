'use strict';
export {};
import globalObj from './global';
import * as api from './api';
globalObj.server = {};

import express from 'express';
const app = express();
import WebSocket from 'ws';

class myWebSocket extends WebSocket {
  isAlive: boolean = true;
  ip: string = 'no ip given';
  dmxValuesUpdate?: (dmxValues: number[]) => void;
  lightboardUpdate?: (update: lightboardUpdate) => void;
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
      
    } catch (e) { 
      console.error('Bad JSON from ' + ws.ip);
      console.log(msg)
      console.log(e)
    }
    if (clientMsg!) ws.send(JSON.stringify(api.processApiCmd(clientMsg)));
  });
  ws.dmxValuesUpdate = (dmxValues) => {
    ws.send(JSON.stringify(api.processDmxValuesUpdate(dmxValues)));
  };
  ws.lightboardUpdate = (update) => {
    //code me
  }
  globalObj.dmx!.on('change', ws.dmxValuesUpdate);
  globalObj.event.on('lightboardChange', ws.lightboardUpdate);
  //console.log(globalObj.dmx)
  ws.on('close', () => {
    globalObj.dmx!.removeListener('change', ws.dmxValuesUpdate!);
    globalObj.event.removeListener('lightboardChange', ws.lightboardUpdate!);
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

globalObj.connectedClients = () => {
  let clients: string[] = [];
  wss.clients.forEach((ws) => {
    clients.push((<myWebSocket>ws).ip);
  });
  return clients;
};

wss.on('close', () => {
  clearInterval(beatInterval);
});
