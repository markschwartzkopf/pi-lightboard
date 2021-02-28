type serverMsg =
  | { type: 'error'; data: string }
  | { type: 'info'; data: string }
  | {
      type: 'controlView';
      data: clientView;
    }
  | {
      type: 'controlViewUpdate';
      data: clientViewUpdate;
    }
  | { type: 'userNavButtons'; data: userNavButton[] };

type userNavButton = { label: string; id: string };

type clientViewUpdate = {
  controls: {index: number, value: interfaceValue}[];
  id: string;
  view: number;
};

type clientView = {
  controls: controlInterface[];
  id: string;
  view: number;
  label?: string;
  views?: string[];
};

type controlInterface = {
  label1?: string;
  label2?: string;
  label3?: string;
  readonly?: 'true';
} & (
  | rangeInterface
  | colorInterface
  | enumInterface
  | colorEnumInterface
  | loopInterface
);

type rangeInterface = { type: 'range'; value: number };
type colorInterface = {
  type: 'color';
  primaries?: [rgb, rgb, rgb];
  value: { type: 'color'; hue: number; saturation: number };
};
type enumInterface = {
  type: 'enum';
  strings?: string[];
  value: { type: 'enum'; value: number };
};
type colorEnumInterface = {
  type: 'colorEnum';
  colors?: rgb[];
  value: { type: 'color'; hue: number; saturation: number };
};
type loopInterface = {
  type: 'loop';
  value: { type: 'loop'; value: number };
};

type interfaceValue = controlInterface['value'];

type rgb = [number, number, number];

type clientMsg =
  | { command: 'init' }
  | ({ command: 'setValue' } & setValueCommand)
  | ({ command: 'subscribe' } & subscribeCommand)
  | ({ command: 'unsubscribe' } & subscribeCommand)
  | ({ command: 'select' } & selectCommand);

type setValueCommand = {
  id: string;
  view: number;
  controlIndex: number;
  value: interfaceValue;
};

type subscribeCommand = { id: string; view: number };

type selectCommand = {
  number: number;
  type: 'faders' | 'selected';
  operation: 'selected' | 'deselected';
  reset: boolean;
};