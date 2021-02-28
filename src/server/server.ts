'use strict';
export { myWebSocket };
import definitions from './fixtureDefinitions';
import { dmx } from './global';

import { userNavButtons } from './file';
let blah = userNavButtons;
import Group from './groups';
import * as api from './api';

// todo: switch to a more minimal html server
import express from 'express';
const app = express();
import WebSocket from 'ws';
import Fixture from './fixtures';

interface myWebSocket extends WebSocket {
  isAlive: boolean;
  ip: string;
  userNavButtons: userNavButton[];
  subscribe: (cmd: subscribeCommand) => clientView | null;
  unsubscribe: (cmd: subscribeCommand) => boolean;
  removeSubscriptions: { id: string; view: number; unsub: () => void }[];
  setValue: (cmd: setValueCommand) => void;
  selection: Group;
  select: (cmd: selectCommand) => void;
}

app.use(express.static(__dirname + '/../public', { index: 'index.html' }));

const server = app.listen(80, () => console.log('Listening on port 80.'));

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: myWebSocket, req) => {
  //first implement myWebSocket interface... there has to be a better way to do this and have TypeScript allow properties to be added to ws
  ws.isAlive = true;
  ws.ip = 'no ip given';
  ws.userNavButtons = userNavButtons;
  ws.removeSubscriptions = [];
  ws.selection = new Group('adHoc');
  ws.select = (cmd) => select(cmd, ws);
  ws.setValue = setValue;
  ws.subscribe = (cmd) => {
    let maybeControlObject = Fixture.getObjectById(cmd.id);
    if (maybeControlObject == null) return null;
    let controlObject = maybeControlObject;
    let viewListener: viewListener = (
      type: 'init' | 'update',
      change: clientView | clientViewUpdate
    ) => {
      switch (type) {
        case 'init':
          let clientView = change as clientView;
          ws.send(toClient({ type: 'controlView', data: clientView }));
          break;
        case 'update':
          let clientViewUpdate = change as clientViewUpdate;
          ws.send(
            toClient({ type: 'controlViewUpdate', data: clientViewUpdate })
          );
          break;
      }
    };
    controlObject.on(cmd.view.toString(), viewListener);
    let unsub = () => {
      controlObject.removeListener(cmd.view.toString(), viewListener);
    };
    ws.removeSubscriptions.push({ id: cmd.id, view: cmd.view, unsub: unsub });
    return controlObject.getView(cmd.view);
  };
  ws.unsubscribe = (cmd) => {
    for (let x = 0; x < ws.removeSubscriptions.length; x++) {
      let remover = ws.removeSubscriptions[x];
      if (remover.id == cmd.id && remover.view == cmd.view) {
        remover.unsub();
        ws.removeSubscriptions.splice(x, 1);
        return true;
      }
    }
    return false;
  };
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
  ws.on('close', () => {
    for (let x = 0; x < ws.removeSubscriptions.length; x++) {
      ws.removeSubscriptions[x].unsub();
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

function select(cmd: selectCommand, ws: myWebSocket) {
  if (cmd.reset) {
    ws.selection = new Group('adHoc');
    if (cmd.operation == 'deselected') return;
  }
  /* switch (cmd.type) {
    case 'faders':
      let fader = ws._faders[cmd.number];
      if (fader.type != 'empty') {
        if (cmd.operation == 'selected') {
          ws.selection.addMember(fader);
        } else ws.selection.removeMember(fader);
        console.log(ws.selection.memberIds);
      }
      break;
    case 'selected':
      console.error('code select properties');
      break;
  } */
}

function toClient(msg: serverMsg): string {
  //this function only exists as a type-enforced stringify
  return JSON.stringify(msg);
}

function setValue(cmd: setValueCommand) {
  let controlObject = Group.getObjectById(cmd.id);
  if (controlObject == null) return;
  controlObject.views[cmd.view].elements[cmd.controlIndex].setValue(cmd.value);
}
