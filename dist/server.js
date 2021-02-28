'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("./file");
let blah = file_1.userNavButtons;
const groups_1 = __importDefault(require("./groups"));
const api = __importStar(require("./api"));
// todo: switch to a more minimal html server
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const ws_1 = __importDefault(require("ws"));
const fixtures_1 = __importDefault(require("./fixtures"));
app.use(express_1.default.static(__dirname + '/../public', { index: 'index.html' }));
const server = app.listen(80, () => console.log('Listening on port 80.'));
const wss = new ws_1.default.Server({ server });
wss.on('connection', (ws, req) => {
    //first implement myWebSocket interface... there has to be a better way to do this and have TypeScript allow properties to be added to ws
    ws.isAlive = true;
    ws.ip = 'no ip given';
    ws.userNavButtons = file_1.userNavButtons;
    ws.removeSubscriptions = [];
    ws.selection = new groups_1.default('adHoc');
    ws.select = (cmd) => select(cmd, ws);
    ws.setValue = setValue;
    ws.subscribe = (cmd) => {
        let maybeControlObject = fixtures_1.default.getObjectById(cmd.id);
        if (maybeControlObject == null)
            return null;
        let controlObject = maybeControlObject;
        let viewListener = (type, change) => {
            switch (type) {
                case 'init':
                    let clientView = change;
                    ws.send(toClient({ type: 'controlView', data: clientView }));
                    break;
                case 'update':
                    let clientViewUpdate = change;
                    ws.send(toClient({ type: 'controlViewUpdate', data: clientViewUpdate }));
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
    ws.on('message', (msg) => {
        let clientMsg;
        try {
            clientMsg = JSON.parse(msg);
            ws.send(JSON.stringify(api.processApiCmd(clientMsg, ws)));
        }
        catch (e) {
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
        if (ws.isAlive === false) {
            ws.terminate();
            console.log('closed dead connection for: ' + ws.ip);
        }
        ws.isAlive = false;
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
function select(cmd, ws) {
    if (cmd.reset) {
        ws.selection = new groups_1.default('adHoc');
        if (cmd.operation == 'deselected')
            return;
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
function toClient(msg) {
    //this function only exists as a type-enforced stringify
    return JSON.stringify(msg);
}
function setValue(cmd) {
    let controlObject = groups_1.default.getObjectById(cmd.id);
    if (controlObject == null)
        return;
    controlObject.views[cmd.view].elements[cmd.controlIndex].setValue(cmd.value);
}
