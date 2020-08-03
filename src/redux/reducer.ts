import { RootState } from './store';

export const rootReducer = (state: RootState, action: any): RootState => {
  if (action.type === 'INIT') {
    console.log(action.payload);
  }
  return state;
};
