type fixtureInit = { label: string; type: fixtureType; dmx: number[] };

type dmxClaim = { fixture: undefined | import('../../fixtures').default; type: string };

type serverFader =
  | serverFaderFixture
  | { type: 'dmx'; index: number}
  | { type: 'empty' };

type serverFaderFixture = { type: 'fixture'; fixture: import('../../fixtures').default };

type dmxChange = {channel: number, value: number};