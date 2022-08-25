type objectType = 'fixture' | 'group';
type GroupVal = { t: 'g'; v: number; min: number; max: number };
type FixtureVal = { t: 'f'; v: number };
type ObjectVal = GroupVal | FixtureVal

type SettingType = {
	std: { type: 'std'; val: ObjectVal }; //range from 0 - 1
	color: { type: 'color'; h: ObjectVal, s: ObjectVal }; //hue range from 0 - 2Pi, saturation range from 0 - 1
};

type Settings = {
	//[K: string]: settingType[keyof settingType]; //But...
	//Forcing all properties to a type by name
	//To prevent intersection of two same-named properties with different types
	color?: SettingType['color'];
	value?: SettingType['std'];
};