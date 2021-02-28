type fixtureInit = { label: string; type: fixtureType; dmx: number[]; id?: string};

type dmxClaim = {
  fixture: undefined | import('../../fixtures').default;
  type: string;
};

type labels = { label1?: string; label2?: string; label3?: string };

type dmxChange = { channel: number; value: number };

type groupMember =
  | { type: 'group'; member: import('../../groups').default }
  | { type: 'fixture'; member: import('../../fixtures').default };

//this is almost certainly wrong:
type groupExclude =
  | { type: 'fixture'; fixtureId: number }
  | { type: 'fixtureValue'; fixtureId: number; valueName: string };

type groupValue = {
  valueName: string;
  current: number;
  start: number;
  members: { member: groupMember; startValue: number }[];
};

type view = {
  label: string;
  elements: {
    setValue: (value: interfaceValue) => void;
    getValue: () => interfaceValue;
    controlInterface: controlInterface;
  }[];
};

type viewListener =
  | ((type: 'init', change: clientView) => void)
  | ((type: 'update', change: clientViewUpdate) => void);
