import { store } from '../store';
import { updateBar } from './updateBar';

export const stopSong = () => {
  store.setState({ songState: 'stop', hasRepeated: {} });
  updateBar();
};
