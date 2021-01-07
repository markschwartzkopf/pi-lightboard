type faderType = 'dmx' | 'fixture' | 'fixtureProperty';

type serverMsg =
  | { type: 'dmxValues'; data: number[] }
  | { type: 'dmxClaims'; data: dmxClaimToClient[] }
  | { type: 'fixtureValues'; data: fixtureProperties[] }
  | { type: 'fixtureLabels'; data: string[] }
  | { type: 'fixtureProperties'; data: fixtureProperties}
  | { type: 'error'; data: string }
  | { type: 'info'; data: string };

type clientMsg =
  | { command: 'dmx' }
  | { command: 'dmxClaims' }
  | { command: 'fixtures' }
  | { command: 'fixtureLabels' }
  | { command: 'setValue'; type: faderType; number: number; value: number; valueName: string }
  | { command: 'getFixture'; number: number};

type lightboardUpdate =
  | { type: 'dmxNames'; data: string[] }
  | { type: 'other'; data: string };

type fixtureProperties = {fixture: number, dmx: { property: string; value: number }[], indirect: { property: string; value: number }[]}

type dmxClaim = { fixture: number; type: channelType };

type dmxClaimToClient = {fixtureLabel: string, type: channelType} | null;

type fixtureType = 'basic' | 'basicRGB'

