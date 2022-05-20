import { loadState } from './state';
loadState().then(() => {
  require('./hvserver');
});
