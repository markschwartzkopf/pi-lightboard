'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const fixtures_1 = __importDefault(require("./fixtures"));
const global_1 = require("./global");
global_1.fixtures.all = [
    new fixtures_1.default('One', 'basic', [0], global_1.dmx),
    new fixtures_1.default('Two', 'basic', [0], global_1.dmx),
];
fs_1.default.readFile(__dirname + '/../fixtures.json', (err, data) => {
    if (err) {
        console.log('Semi-expected file error:' + err);
        console.log('Intializing fixtures.json');
        updateFixtureFile();
    }
    else {
        let corrupt = false;
        let fileFixtures;
        try {
            fileFixtures = JSON.parse(data.toString());
        }
        catch (e) {
            corrupt = true;
            fileFixtures = [];
        }
        if (!corrupt)
            global_1.fixtures.all = [];
        if (Array.isArray(fileFixtures) && !corrupt) {
            for (let x = 0; x < fileFixtures.length; x++) {
                if (typeof fileFixtures[x] == 'object' &&
                    Object.keys(fileFixtures[x]).length == 3 &&
                    fileFixtures[x].label &&
                    fileFixtures[x].type &&
                    fixtures_1.default.validateDmxArray(fileFixtures[x].dmx, global_1.dmx)) {
                    global_1.fixtures.all.push(new fixtures_1.default(fileFixtures[x].label, fileFixtures[x].type, fileFixtures[x].dmx, global_1.dmx));
                }
                else
                    corrupt = true;
            }
        }
        if (corrupt)
            console.error('Fixtures.json contains invalid data');
    }
});
function updateFixtureFile() {
    let fixtureJSON = [];
    for (let x = 0; x < global_1.fixtures.all.length; x++) {
        fixtureJSON.push({
            label: global_1.fixtures.all[x].label,
            type: global_1.fixtures.all[x].type,
            dmx: global_1.fixtures.all[x].dmxChannels,
        });
    }
    let data = JSON.stringify(fixtureJSON, null, 2);
    fs_1.default.writeFile(__dirname + '/../fixtures.json', data, (err) => {
        if (err) {
            console.error('Error writing fixtures.json: ' + err);
        }
        else {
            //console.log("controlparams.json updated");
        }
    });
}
