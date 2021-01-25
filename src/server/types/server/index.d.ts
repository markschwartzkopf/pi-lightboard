type fixtureInit = { label: string; type: fixtureType; dmx: number[] };

type dmxClaim = { fixture: number; type: channelType };

type serverFader = {type: 'fixture', fixture: import('../../fixtures').default} | {type: 'dmx'} | {type: 'empty'};


/* type fader =
  | { type: 'fixture'; fixture: import('../fixtures').default; apiFader: rangeFader | enumFader }
  | { type: 'dmx'; number: number; apiFader: rangeFader | enumFader}
  | {
      type: 'fixtureProperty';
      fixture: import('../fixtures').default;
      property: string;
      apiFader: rangeFader | enumFader
    }
  | { type: 'group'; group: 'code me'; apiFader: rangeFader | enumFader };
 */



/* class myWebSocket extends WebSocket {
  isAlive: boolean = true;
  ip: string = 'no ip given';
  faders: fader[] = [];
  redrawFadersJSON: { new: string; old: string } = { new: '', old: '' };
  updateFadersJSON: { new: string; old: string } = { new: '', old: '' };
  selectedFixtures: { type: faderType; number: number }[] = [];
  dmxValuesUpdate?: (dmxValues: number[]) => void;
}
 */