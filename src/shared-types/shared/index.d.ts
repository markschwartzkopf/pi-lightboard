type faderType = 'dmx' | 'fixture' | 'fixtureProperty';

type serverMsg =
  | { type: 'dmxValues'; data: number[] }
  | { type: 'dmxClaims'; data: dmxClaimToClient[] }
  | { type: 'fixtureValues'; data: fixtureProperties[] }
  | { type: 'fixtureLabels'; data: string[] }
  | { type: 'fixtureProperties'; data: fixtureProperties }
  | { type: 'error'; data: string }
  | { type: 'info'; data: string }
  | { type: 'redrawFaders'; data: (rangeFader | enumFader)[] }
  | { type: 'updateFaders'; data: number[] }
  | { type: 'redrawSelected'; data: any }
  | { type: 'updateSelected'; data: any };

type rangeFader = {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  superLabel?: string;
};
type enumFader = {
  value: number;
  values: string[];
  label: string;
  superLabel?: string;
};

type clientMsg =
  | { command: 'init' }
  | { command: 'dmx' }
  | { command: 'dmxClaims' }
  | { command: 'fixtures' }
  | { command: 'fixtureLabels' }
  | {
      command: 'setValue';
      type: faderType;
      number: number;
      value: number;
      valueName: string;
    }
  | { command: 'getFixture'; number: number }
  | {
      command: 'select';
      number: number;
      operation: 'selected' | 'deselected' | 'toggle';
      reset: boolean;
    }
  | { command: 'display'; type: displayType };

type displayType = 'dmx' | 'fixtures' | 'group' | number;

type lightboardUpdate =
  | { type: 'dmxNames'; data: string[] }
  | { type: 'other'; data: string };

type fixtureProperties = {
  fixture: number;
  dmx: { property: string; value: number }[];
  indirect: { property: string; value: number }[];
};

type dmxClaimToClient = { fixtureLabel: string; type: channelType } | null;

type fixtureType = 'basic' | 'basicRGB';
