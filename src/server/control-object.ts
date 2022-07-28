import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

interface ObjectEvents {
	change: (newSettings: Settings, oldSettings: Settings) => void;
}

interface ControlObject {
	on<U extends keyof ObjectEvents>(event: U, listener: ObjectEvents[U]): this;
	off<U extends keyof ObjectEvents>(event: U, listener: ObjectEvents[U]): this;
	emit<U extends keyof ObjectEvents>(event: U, ...args: Parameters<ObjectEvents[U]>): boolean;
}

class ControlObject extends EventEmitter {
	label = '';
	id: string;
	settings: Settings;
	private _updateSettings: (newSettings: Settings) => Settings;

	constructor(updateSettings: (newSettings: Settings) => Settings, id?: string) {
		super();
		if (id) {
			this.id = id;
		} else this.id = uuidv4();
		this._updateSettings = updateSettings;
		this.settings = updateSettings({});
	}

	changeSettings(newSettings: Settings) {
		const settingsKeys = Object.keys(newSettings) as (keyof typeof newSettings)[];
		//sanity check settings:
		let dataError = false;
		for (let i = 0; i < settingsKeys.length; i++) {
			const setting = this.settings[settingsKeys[i]]!;
			switch (setting.type) {
				case 'std':
					if (
						!(
							setting.val <= 1 &&
							setting.maxVal <= 1 &&
							setting.minVal <= 1 &&
							setting.val >= 0 &&
							setting.maxVal >= 0 &&
							setting.minVal >= 0
						)
					) {
						dataError = true;
					}
					break;
				case 'color':
					if (
						!(
							setting.h <= Math.PI * 2 &&
							setting.maxH <= Math.PI * 2 &&
							setting.minH <= Math.PI * 2 &&
							setting.h >= 0 &&
							setting.maxH >= 0 &&
							setting.minH >= 0 &&
							setting.s <= 1 &&
							setting.maxS <= 1 &&
							setting.minS <= 1 &&
							setting.s >= 0 &&
							setting.maxS >= 0 &&
							setting.minS >= 0
						)
					) {
						dataError = true;
					}
					break;
			}
			if (!dataError) {
				const oldSettings = this.settings;
				this.settings = this._updateSettings(newSettings);
				this.emit('change', this.settings, oldSettings);
			} else console.error('Invalid control parameters: ' + JSON.stringify(newSettings[settingsKeys[i]]));
		}
	}
}

export default ControlObject;
