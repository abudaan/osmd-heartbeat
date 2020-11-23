import { store } from './store';

const divPlayhead = document.getElementById('playhead') as HTMLDivElement;

const draw = () => {
  const { playhead } = store.getState();
  divPlayhead.style.top = `${playhead.y}px`;
  divPlayhead.style.left = `${playhead.x}px`;
  divPlayhead.style.width = '10px'; //`${playhead.width}px`;
  divPlayhead.style.height = `${playhead.height}px`;
};

export const setup = () => {
  const unsub1 = store.subscribe(
    () => {
      draw();
    },
    state => state.currentBar
  );

  const unsub2 = store.subscribe(
    loaded => {
      if (loaded) {
        console.log('draw');
        draw();
      }
    },
    state => state.loaded
  );

  const unsub3 = store.subscribe(
    (currentPosition: number) => {
      const {
        offsetX,
        currentBarStartX,
        currentBarStartMillis,
        pixelsPerMillisecond,
      } = store.getState();
      const relPos = currentPosition - currentBarStartMillis;
      divPlayhead.style.left = `${offsetX + currentBarStartX + relPos * pixelsPerMillisecond}px`;
    },
    state => state.currentPosition
  );

  return {
    cleanup: () => {
      unsub1();
      unsub2();
      unsub3();
    },
  };
};
