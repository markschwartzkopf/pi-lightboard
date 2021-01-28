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
const global_1 = require("./global");
const api = __importStar(require("./api"));
// todo: switch to a more minimal html server
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const ws_1 = __importDefault(require("ws"));
app.use(express_1.default.static(__dirname + '/../public', { index: 'index.html' }));
const server = app.listen(80, () => console.log('Listening on port 80.'));
const wss = new ws_1.default.Server({ server });
wss.on('connection', (ws, req) => {
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
        get: () => {
            return ws._faders.map((x) => {
                switch (x.type) {
                    case 'dmx':
                        let xDmx = x;
                        let index = xDmx.index;
                        let fader = {
                            type: 'range',
                            min: 0,
                            max: 255,
                            step: 1,
                            loop: false,
                        };
                        if (global_1.dmx.claimed[index].fixture) {
                            fader.subLabel1 = global_1.dmx.claimed[index].type;
                            fader.subLabel2 = global_1.dmx.claimed[index].fixture.label;
                        }
                        return {
                            fader: fader,
                            value: global_1.dmx.getValue(index),
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
            });
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
    ws.dmxValuesUpdate = (changes) => {
        let updates = [];
        for (let x = 0; x < changes.length; x++) {
            for (let y = 0; y < ws._faders.length; y++) {
                let fader = ws._faders[y];
                if (ws._faders[y].type == 'dmx' && fader.index == changes[x].channel) {
                    updates.push({ index: y, value: changes[x].value });
                }
            }
        }
        if (updates.length > 0) {
            let updateMsg = { type: 'updateFaders', data: updates };
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
function faderInit(type, ws) {
    for (let x = 0; x < ws.removeSubscriptions.length; x++) {
        ws.removeSubscriptions[x]();
    }
    global_1.dmx.on('change', ws.dmxValuesUpdate);
    ws.removeSubscriptions[0] = () => {
        global_1.dmx.removeListener('change', ws.dmxValuesUpdate);
    };
    ws._faders = [];
    switch (type) {
        case 'dmx':
            ws._faders = global_1.dmx
                .getValue()
                .slice(1)
                .map((x, index) => ({ type: 'dmx', index: index + 1 })); //slice(1) and +1 offset
            break;
        case 'fixtures':
            for (let x = 0; x < global_1.fixtures.all.length; x++) {
                ws._faders.push({ type: 'fixture', fixture: global_1.fixtures.all[x] });
                let xCopy = x;
                let fixtureChangeCallback = (changes) => {
                    for (let y = 0; y < changes.length; y++) {
                        if (changes[y].valueName == 'value') {
                            let updateMsg = {
                                type: 'updateFaders',
                                data: [{ index: xCopy, value: changes[y].value }],
                            };
                            ws.send(JSON.stringify(updateMsg));
                        }
                    }
                };
                global_1.fixtures.all[x].on('change', fixtureChangeCallback);
                ws.removeSubscriptions.push(() => {
                    global_1.fixtures.all[x].removeListener('change', fixtureChangeCallback);
                });
            }
            break;
        default:
            console.error('code serverFader init type: ' + type);
            break;
    }
}
function setValue(index, value, faders) {
    switch (faders[index].type) {
        case 'dmx':
            let dmxFader = faders[index];
            global_1.dmx.setValues([{ channel: dmxFader.index, value: value }]);
            break;
        case 'fixture':
            let fixtureFader = faders[index];
            fixtureFader.fixture.setValue(value);
            break;
        case 'empty':
            console.error('Cannot setValue for empty faders');
            break;
    }
}
