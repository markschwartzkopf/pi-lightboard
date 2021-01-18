'use strict';
import fs from 'fs';
import Fixture from './fixtures';
import { dmx, fixtures } from './global';
export {};

fixtures.all = [
  new Fixture('One', 'basic', [0], dmx),
  new Fixture('Two', 'basic', [0], dmx),
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
    if (!corrupt) fixtures.all = [];
    if (Array.isArray(fileFixtures) && !corrupt) {
      for (let x = 0; x < fileFixtures.length; x++) {
        if (
          typeof fileFixtures[x] == 'object' &&
          Object.keys(fileFixtures[x]).length == 3 &&
          fileFixtures[x].label &&
          fileFixtures[x].type &&
          Fixture.validateDmxArray(fileFixtures[x].dmx, dmx)
        ) {
          fixtures.all.push(
            new Fixture(
              fileFixtures[x].label,
              fileFixtures[x].type,
              fileFixtures[x].dmx,
              dmx
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
  for (let x = 0; x < fixtures.all.length; x++) {
    fixtureJSON.push({
      label: fixtures.all[x].label,
      type: fixtures.all[x].type,
      dmx: fixtures.all[x].dmxChannels,
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