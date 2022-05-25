type objectType = 'fixture' | 'group';
interface settings {
  //[K: string]: settingType[keyof settingType]; //But...
  //Forcing all properties to a type by name
  //To prevent intersection of two same-named properties with different types
  r?: settingType['std'];
  g?: settingType['std'];
  b?: settingType['std'];
  hue?: settingType['hue'];
  saturation?: settingType['std'];
  value?: settingType['std'];
}

interface settingType {
  std: { type: 'std'; range: [number, number]; val: number; minOffset: number; maxOffset: number };
  hue: { type: 'hue'; val: number; curMin: number; curMax: number };
}
