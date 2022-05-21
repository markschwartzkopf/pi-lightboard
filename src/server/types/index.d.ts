type objectType = 'fixture' | 'group';
type objectNumber = { val: number; min: number; max: number };
interface valuesType {
  value?: objectNumber;
  color?: { hue: objectNumber; saturation: objectNumber };
  R?: objectNumber;
  G?: objectNumber;
  B?: objectNumber;
  A?: objectNumber;
  W?: objectNumber;
}
