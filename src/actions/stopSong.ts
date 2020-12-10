import { store } from '../store';
import { updateBar } from './updateBar';

export const stopSong = () => {
  console.log('STOP');
  store.setState({ songState: 'stop', hasRepeated: {} });
  updateBar();
};
