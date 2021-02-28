'use strict';
import fs from 'fs';
import Fixture from './fixtures';
import Group from './groups';
import { dmx } from './global';

/* export let allGroups = new Group('allGroups');
export let allDmx = new Group('allDmx'); */
export let userNavButtons: userNavButton[] = [
  { label: 'Fixtures', id: 'allFixtures' },
  { label: 'Groups', id: 'allGroups' },
  { label: 'DMX', id: 'allDmx' },
];

//let x = new Fixture('One', 'basic', [1], dmx);
//let y = new Fixture('Two', 'basic', [2], dmx);

fs.readFile(__dirname + '/../fixtures.json', (err, data) => {
  let corrupt = false;
  let fileFixtures: fixtureInit[] = [];
  if (err) {
    console.log('Semi-expected file error:' + err);
    corrupt = true;
  } else {
    try {
      fileFixtures = JSON.parse(data.toString());
    } catch (e) {
      corrupt = true;
      fileFixtures = [];
    }
    if (
      (!corrupt && fileFixtures.length == 0) ||
      !Array.isArray(fileFixtures)
    ) {
      corrupt = true;
      console.error('Fixtures.json contains invalid array data');
    }
  }
  if (!corrupt) {
    for (let x = 0; x < fileFixtures.length; x++) {
      if (
        typeof fileFixtures[x] == 'object' &&
        Object.keys(fileFixtures[x]).length >= 3 &&
        fileFixtures[x].label &&
        fileFixtures[x].type &&
        Fixture.validateDmxArray(fileFixtures[x].dmx, dmx)
      ) {
        new Fixture(
          fileFixtures[x].label,
          fileFixtures[x].type,
          fileFixtures[x].dmx,
          dmx,
          fileFixtures[x].id
        );
      } else {
        corrupt = true;
        console.error('Fixtures.json contains invalid data');
      }
    }
  }
  if (corrupt) {
    console.log('Re-intializing fixtures.json');
    new Fixture('One', 'basic', [1], dmx);
    new Fixture('Two', 'basic', [2], dmx);
    updateFixtureFile();
  }
});

function updateFixtureFile() {
  let fixtureJSON: fixtureInit[] = [];
  let maybeAllFixtures = Group.getObjectById('allFixtures');
  let allFixtures: Group;
  if (!maybeAllFixtures || maybeAllFixtures.type != 'group') {
    console.error('missing "allFixtures" group, fixtures.json not written');
    return;
  }
  allFixtures = maybeAllFixtures as Group;
  for (let x = 0; x < allFixtures.members.length; x++) {
    let member = allFixtures.members[x] as Fixture;
    fixtureJSON.push({
      id: member.id,
      label: member.label,
      type: member.type,
      dmx: member.dmxChannels,
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
