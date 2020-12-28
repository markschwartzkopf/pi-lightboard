type faderType = 'dmx' | 'fixture';

type serverMsg =
  | {
      type: 'dmxValues';
      data: number[];
    }
  | {
      type: 'error';
      data: string;
    }
  | {
      type: 'info';
      data: string;
    };

type clientMsg =
  | { command: 'dmx' }
  | { command: 'setValue'; type: faderType; number: number; value: number };

type lightboardUpdate =
  | { type: 'dmxNames'; data: string[] }
  | { type: 'other'; data: string };
