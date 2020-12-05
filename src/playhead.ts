import { store } from './store';

const playheadWidth = 25;
const divPlayhead = document.getElementById('playhead') as HTMLDivElement;

export const draw = (dim: { x: number; y: number; width: number; height: number }) => {
  const { x, y, height } = dim;
  const {
    offset: { x: offsetX, y: offsetY },
  } = store.getState();
  // console.log('draw', x, y);
  divPlayhead.style.top = `${y + offsetY}px`;
  divPlayhead.style.left = `${x + offsetX - playheadWidth / 2}px`;
  divPlayhead.style.width = `${playheadWidth}px`; //`${playhead.width}px`;
  divPlayhead.style.height = `${height}px`;
};

export const setup = () => {
  const unsub = store.subscribe(
    (playheadPositionPixels: number) => {
      divPlayhead.style.left = `${playheadPositionPixels}px`;
    },
    state => state.playheadPositionPixels
  );

  return {
    cleanup: () => {
      unsub();
    },
  };
};
