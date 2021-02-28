'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNavButtons = void 0;
const fs_1 = __importDefault(require("fs"));
const fixtures_1 = __importDefault(require("./fixtures"));
const groups_1 = __importDefault(require("./groups"));
const global_1 = require("./global");
/* export let allGroups = new Group('allGroups');
export let allDmx = new Group('allDmx'); */
exports.userNavButtons = [
    { label: 'Fixtures', id: 'allFixtures' },
    { label: 'Groups', id: 'allGroups' },
    { label: 'DMX', id: 'allDmx' },
];
//let x = new Fixture('One', 'basic', [1], dmx);
//let y = new Fixture('Two', 'basic', [2], dmx);
fs_1.default.readFile(__dirname + '/../fixtures.json', (err, data) => {
    let corrupt = false;
    let fileFixtures = [];
    if (err) {
        console.log('Semi-expected file error:' + err);
        corrupt = true;
    }
    else {
        try {
            fileFixtures = JSON.parse(data.toString());
        }
        catch (e) {
            corrupt = true;
            fileFixtures = [];
        }
        if ((!corrupt && fileFixtures.length == 0) ||
            !Array.isArray(fileFixtures)) {
            corrupt = true;
            console.error('Fixtures.json contains invalid array data');
        }
    }
    if (!corrupt) {
        for (let x = 0; x < fileFixtures.length; x++) {
            if (typeof fileFixtures[x] == 'object' &&
                Object.keys(fileFixtures[x]).length >= 3 &&
                fileFixtures[x].label &&
                fileFixtures[x].type &&
                fixtures_1.default.validateDmxArray(fileFixtures[x].dmx, global_1.dmx)) {
                new fixtures_1.default(fileFixtures[x].label, fileFixtures[x].type, fileFixtures[x].dmx, global_1.dmx, fileFixtures[x].id);
            }
            else {
                corrupt = true;
                console.error('Fixtures.json contains invalid data');
            }
        }
    }
    if (corrupt) {
        console.log('Re-intializing fixtures.json');
        new fixtures_1.default('One', 'basic', [1], global_1.dmx);
        new fixtures_1.default('Two', 'basic', [2], global_1.dmx);
        updateFixtureFile();
    }
});
function updateFixtureFile() {
    let fixtureJSON = [];
    let maybeAllFixtures = groups_1.default.getObjectById('allFixtures');
    let allFixtures;
    if (!maybeAllFixtures || maybeAllFixtures.type != 'group') {
        console.error('missing "allFixtures" group, fixtures.json not written');
        return;
    }
    allFixtures = maybeAllFixtures;
    for (let x = 0; x < allFixtures.members.length; x++) {
        let member = allFixtures.members[x];
        fixtureJSON.push({
            id: member.id,
            label: member.label,
            type: member.type,
            dmx: member.dmxChannels,
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
