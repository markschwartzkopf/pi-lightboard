type serverMsg =
  | { type: 'error'; data: string }
  | { type: 'info'; data: string }
  | { type: 'drawFaders'; data: faderData[] }
  | { type: 'updateFaders'; data: faderUpdate[] }
  | { type: 'drawSelected'; data: any }
  | { type: 'updateSelected'; data: any };



type faderUpdate = { index: number; value: number };
type faderData = {
  fader: fader;
  value: number;
  label: string;
  selected?: true;
};
type fader = rangeFader | enumFader | emptyFader;

type rangeFader = {
  type: 'range';
  min: number;
  max: number;
  step: number;
  loop: boolean;
  subLabel1?: string;
  subLabel2?: string;
};
type enumFader = {
  type: 'enum';
  values: string[];
  subLabel1?: string;
  subLabel2?: string;
};
type emptyFader = {
  type: 'empty';
  subLabel1?: string;
  subLabel2?: string;
};

type clientMsg =
  | { command: 'init' }
  | {
      command: 'setValue';
      index: number;
      value: number;
    }
  | {
      command: 'setFaderBank';
      bank: faderBank;
    }
  | ({ command: 'select' } & selectCommand);

type selectCommand = {
  number: number;
  type: 'faders' | 'selected';
  operation: 'selected' | 'deselected';
  reset: boolean;
};

type faderBank = 'dmx' | 'fixtures' | 'groups' | number;

/* type lightboardUpdate =
  | { type: 'dmxNames'; data: string[] }
  | { type: 'other'; data: string }; */

type fixtureProperties = {
  fixture: number;
  dmx: { property: string; value: number }[];
  indirect: { property: string; value: number }[];
};

type fixtureType = 'basic' | 'basicRGB';
