'use strict';
import fs from 'fs';
import Fixture from './fixtures';
import globalObj from './global';
export {};

globalObj.fixtures = [
  new Fixture('One', 'basic', [0], globalObj.dmx),
  new Fixture('Two', 'basic', [0], globalObj.dmx),
];

fs.readFile(__dirname + '/../fixtures.json', (err, data) => {
  if (err) {
    console.log('Semi-expected file error:' + err);
    console.log('Intializing fixtures.json');
    updateFixtureFile();
  } else {
    let corrupt = false;
    let fileFixtures: fixtureInit[];
    try {
      fileFixtures = JSON.parse(data.toString());
    } catch (e) {
      corrupt = true;
      fileFixtures = [];
    }
    if (!corrupt) globalObj.fixtures = [];
    if (Array.isArray(fileFixtures) && !corrupt) {
      for (let x = 0; x < fileFixtures.length; x++) {
        if (
          typeof fileFixtures[x] == 'object' &&
          Object.keys(fileFixtures[x]).length == 3 &&
          fileFixtures[x].label &&
          fileFixtures[x].type &&
          Fixture.validateDmxArray(fileFixtures[x].dmx, globalObj.dmx)
        ) {
          globalObj.fixtures.push(
            new Fixture(
              fileFixtures[x].label,
              fileFixtures[x].type,
              fileFixtures[x].dmx,
              globalObj.dmx
            )
          );
        } else corrupt = true;
      }
    }
    if (corrupt) console.error('Fixtures.json contains invalid data');
  }
});

function updateFixtureFile() {
  let fixtureJSON: fixtureInit[] = [];
  for (let x = 0; x < globalObj.fixtures.length; x++) {
    fixtureJSON.push({
      label: globalObj.fixtures[x].label,
      type: globalObj.fixtures[x].type,
      dmx: globalObj.fixtures[x].dmxChannels,
    });
  }
  let data = JSON.stringify(fixtureJSON, null, 2);
  fs.writeFile(__dirname + '/../fixtures.json', data, (err) => {
    if (err) {
      console.error('Error writing fixtures.json: ' + err);
    } else {
      //console.log("controlparams.json updated");
    }
  });
}