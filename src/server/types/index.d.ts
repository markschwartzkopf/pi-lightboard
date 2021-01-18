type fixtureInit = { label: string; type: fixtureType; dmx: number[] };

type channelType = 'value' | 'red' | 'green' | 'blue';

type dmxClaim = { fixture: number; type: channelType };

type fader =
  | { type: 'fixture'; fixture: Fixture }
  | { type: 'dmx'; number: number }
  | { type: 'fixtureProperty'; fixture: Fixture; property: string}
  | { type: 'group'; group: 'code me'};
