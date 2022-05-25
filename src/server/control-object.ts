import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export default class ControlObject extends EventEmitter {
  label = '';
  id: string;
  settings: settings = { value: { type: 'std', minOffset: 0.5, maxOffset: 0.5, range: [0, 100], val: 0.5 } };
  children: ControlObject[] = []; // | dmxChild[]
  parents: ControlObject[] = [];

  constructor(id?: string) {
    super();
    if (id) {
      this.id = id;
    } else this.id = uuidv4();
  }

  changeSettings(newSettings: settings, caller?: ControlObject) {
    const settingsKeys = Object.keys(newSettings) as (keyof typeof newSettings)[];
    //sanity check settings:
    for (let i = 0; i < settingsKeys.length; i++) {
      const setting = this.settings[settingsKeys[i]]!;
      switch (setting.type) {
        case 'std':
          if (
            !(
              setting.val + setting.maxOffset <= 1 &&
              setting.maxOffset >= 0 &&
              setting.val - setting.minOffset >= 0 &&
              setting.minOffset <= 0 &&
              setting.val >= 0 &&
              setting.val <= 1
            )
          ) {
            console.error('invalid control parameters: ' + JSON.stringify(newSettings[settingsKeys[i]]));
          }
          break;
        case 'hue':
          console.error('code hue sanity check');
      }
    }
    const childSettings: settings[] = this.children.map(() => {
      return {};
    });
    for (let i = 0; i < settingsKeys.length; i++) {
      if (this.settings.hasOwnProperty(settingsKeys[i])) {
        const newSetting = newSettings[settingsKeys[i]]!;
        switch (newSetting.type) {
          case 'std': {
            const oldSetting = this.settings[settingsKeys[i]] as settingType['std'];
            const valChange = newSetting.val - oldSetting.val;
            const minChange = newSetting.minOffset - oldSetting.minOffset;
            const maxChange = newSetting.maxOffset - oldSetting.maxOffset;
            for (let j = 0; j < this.children.length; j++) {
              if (this.children[j].settings.hasOwnProperty(settingsKeys[i])) {
                const childSetting = ((childSettings[j][settingsKeys[i]] as settingType[keyof settingType]) = {
                  ...this.children[j].settings[settingsKeys[i]],
                } as settingType['std']);
                childSetting.val += valChange;
                if (childSetting.val > 1) childSetting.val = 1;
                if (childSetting.val < 0) childSetting.val = 0;
                childSetting.maxOffset += maxChange;
                childSetting.minOffset += minChange;
                if (childSetting.maxOffset < 0) childSetting.maxOffset = 0;
                if (childSetting.minOffset < 0) childSetting.minOffset = 0;
                if (childSetting.val + childSetting.maxOffset > 1) childSetting.maxOffset = 1 - childSetting.val;
                if (childSetting.val - childSetting.minOffset < 0) childSetting.minOffset = childSetting.val;
              }
            }
            break;
          }
          case 'hue':
            console.error('code changeSettings for hue');
            break;
          default:
            console.error('changeSettings received unknown settingType');
        }
      }
    }
    for (let i = 0; i < childSettings.length; i++) {
      if (Object.keys(childSettings[i]).length > 0) this.children[i].changeSettings(childSettings[i], this);
    }
    if (this.pullSettings && caller) this.pullSettings(); //Don't recalculate averages from stepped/enum children while actively morphing
    this.pushSettings();
  }

  pushSettings() {
    for (let i = 0; i < this.parents.length; i++) {
      this.parents[i].pullSettings();
    }
  }

  pullSettings() {
    const stdSettings: { [K: string]: settingType['std'][] } = {};
    for (let i = 0; i < this.children.length; i++) {
      const settings = this.children[i].settings;
      for (const settingKey in settings) {
        if (settings.hasOwnProperty(settingKey)) {
          const setting = settings[settingKey as keyof settings]!;
          switch (setting.type) {
            case 'std':
              if (!stdSettings.hasOwnProperty(settingKey)) {
                stdSettings[settingKey] = [{ ...setting }];
              } else stdSettings[settingKey].push({ ...setting });
              break;
            case 'hue':
              console.error('code pullSettings hue type');
              break;
            default:
              console.error('Unknown settingType to pullSettings()');
              break;
          }
        }
      }
    }
    for (const settingKey in stdSettings) {
      if (stdSettings.hasOwnProperty(settingKey) && stdSettings[settingKey].length > 0) {
        const settings = stdSettings[settingKey];
        //range, val, max, min
        let range = settings[0].range;
        let valTotal = 0;
        let max = 0;
        let min = 1;
        for (let i = 0; i < settings.length; i++) {
          const setting = settings[i];
          if (setting.range[0] != range[0] || setting.range[1] != range[1]) range = [0, 100];
          valTotal += setting.val;
          if (setting.val + setting.maxOffset > max) max = setting.val + setting.maxOffset;
          if (setting.val - setting.minOffset < min) min = setting.val - setting.minOffset;
        }
        const val = valTotal / settings.length;
        const newSetting: settingType['std'] = {
          type: 'std',
          range: range,
          val: val,
          maxOffset: max - val,
          minOffset: val - min,
        };
        (this.settings[settingKey as keyof settings] as settings[keyof settings]) = newSetting; // ?????
      }
    }
  }
}
