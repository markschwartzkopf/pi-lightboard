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
/* import globalObj from './global'; */
/* let {dmx} = require('./global') as {dmx: Dmx, fixtures: Fixture[]} */
const global_1 = require("./global");
const api = __importStar(require("./api"));
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const ws_1 = __importDefault(require("ws"));
class myWebSocket extends ws_1.default {
    constructor() {
        super(...arguments);
        this.isAlive = true;
        this.ip = 'no ip given';
        this.faders = [];
        this.redrawFadersJSON = { new: '', old: '' };
        this.updateFadersJSON = { new: '', old: '' };
        this.selectedFixtures = [];
    }
}
app.use(express_1.default.static(__dirname + '/../public', { index: 'index.html' }));
const server = app.listen(80, () => console.log('Listening on port 80.'));
const wss = new ws_1.default.Server({ server });
wss.on('connection', (ws, req) => {
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
        }
        catch (e) {
            console.error('Bad JSON from ' + ws.ip);
            console.log(msg);
            console.log(e);
        }
        if (clientMsg)
            ws.send(JSON.stringify(api.processApiCmd(clientMsg)));
    });
    ws.dmxValuesUpdate = (dmxValues) => {
        ws.send(JSON.stringify(api.processDmxValuesUpdate(dmxValues)));
        ws.send(JSON.stringify(api.processApiCmd({ command: 'fixtures' })));
    };
    global_1.dmx.on('change', ws.dmxValuesUpdate);
    ws.on('close', () => {
        global_1.dmx.removeListener('change', ws.dmxValuesUpdate);
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
/* globalObj.connectedClients = () => {
  let clients: string[] = [];
  wss.clients.forEach((ws) => {
    clients.push((<myWebSocket>ws).ip);
  });
  return clients;
}; */
wss.on('close', () => {
    clearInterval(beatInterval);
});
