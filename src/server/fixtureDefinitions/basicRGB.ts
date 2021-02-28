/* 
export default {
  dmx: [{...dmxFader, subLabel1: 'red'}, {...dmxFader, subLabel1: 'blue'}, {...dmxFader, subLabel1: 'green'}],
  indirect: {
    properties: [{...dmxFader, subLabel1: 'hue'}, {...dmxFader, subLabel1: 'saturation'}, {...dmxFader, subLabel1: 'value'}],
    set: rgbFromHsv,
    get: hsvFromRgb,
  },
}

//functions for processing indirect properties to and from DMX:

function rgbFromHsv(
  rgb: number[],
  type: string,
  newVal: number
): [number, number, number] {
  let hsv = rgbToHsv(rgb);
  switch (type) {
    case 'hue':
      hsv[0] = newVal;
      break;
    case 'saturation':
      hsv[1] = newVal;
      break;
    case 'value':
      hsv[2] = newVal;
      break;
    default:
      console.error('No such property name: ' + type);
      return [-1, -1, -1];
  }
  return hsvToRgb(hsv);
}

function hsvFromRgb(rgb: number[], type: string): number {
  let hsv = rgbToHsv(rgb);
  switch (type) {
    case 'hue':
      return hsv[0];
      break;
    case 'saturation':
      return hsv[1];
      break;
    case 'value':
      return hsv[2];
      break;
    default:
      return -1;
  }
}

function hsvToRgb(hsv: number[]): [number, number, number] {
  let [h, s, v] = hsv;
  let [r, g, b] = [-1, -1, -1];

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  return [r, g, b];
}

function rgbToHsv(rgb: number[]): [number, number, number] {
  let [r, g, b] = rgb;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h: number,
    s: number,
    v = max;
  let d = max - min;
  s = max == 0 ? 0 : d / max;
  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        console.error('Error in rgbToHsv');
        h = 0; //Should never happen
    }
    h /= 6;
  }
  return [h, s, v];
}
 */