type faderType = 'dmx' | 'fixture';

type serverMsg =
  | { type: 'dmxValues'; data: number[] }
  | { type: 'dmxClaims'; data: dmxClaimToClient[] }
  | { type: 'fixtureValues'; data: number[] }
  | { type: 'fixtureLabels'; data: string[] }
  | { type: 'error'; data: string }
  | { type: 'info'; data: string };

type clientMsg =
  | { command: 'dmx' }
  | { command: 'dmxClaims' }
  | { command: 'fixtures' }
  | { command: 'fixtureLabels' }
  | { command: 'setValue'; type: faderType; number: number; value: number; valueName: string };

type lightboardUpdate =
  | { type: 'dmxNames'; data: string[] }
  | { type: 'other'; data: string };

type dmxClaim = { fixture: number; type: channelType };

type dmxClaimToClient = {fixtureLabel: string, type: channelType} | null;

type fixtureType = 'basic' | 'basicRGB'