import HVS from 'http-variable-server';

const hvs = new HVS(__dirname + '/../../dist/public/');

export function getHvs() {
  return hvs;
}
