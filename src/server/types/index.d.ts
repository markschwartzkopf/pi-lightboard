type objectType = 'fixture' | 'group';
interface Settings {
	//[K: string]: settingType[keyof settingType]; //But...
	//Forcing all properties to a type by name
	//To prevent intersection of two same-named properties with different types
	color?: SettingType['color'];
	value?: SettingType['std'];
}

interface SettingType {
	std: { type: 'std'; val: number; minVal: number; maxVal: number }; //range from 0 - 1
	color: { type: 'color'; h: number; minH: number; maxH: number; s: number; minS: number; maxS: number }; //hue range from 0 - 2Pi, saturation range from 0 - 1
}
