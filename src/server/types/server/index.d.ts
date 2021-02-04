type fixtureInit = { label: string; type: fixtureType; dmx: number[] };

type dmxClaim = {
  fixture: undefined | import('../../fixtures').default;
  type: string;
};

type serverFader = groupMember | { type: 'empty' };

type serverFaderFixture = {
  type: 'fixture';
  fixture: import('../../fixtures').default;
};

type dmxChange = { channel: number; value: number };

type groupMember =
  | { type: 'group'; group: import('../../groups').default }
  | { type: 'fixture'; fixture: import('../../fixtures').default }
  | { type: 'dmx'; channel: number };

type groupExclude =
  | { type: 'fixture'; fixtureId: number }
  | { type: 'fixtureValue'; fixtureId: number; valueName: string };
