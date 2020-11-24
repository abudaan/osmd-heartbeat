import { BoundingBoxMeasure } from 'webdaw-modules';
import { store } from './store';

let div: HTMLDivElement;
let offsetX: number;
let offsetY: number;
let scrollPosX: number;
let scrollPosY: number;

// draw rectangles on the score to indicate the set loop
const drawLoop = (boundingBoxes: BoundingBoxMeasure[]) => {
  // div.style.display = 'none';
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  if (boundingBoxes.length > 0) {
    div.style.display = 'block';
    boundingBoxes.forEach(bbox => {
      const d = document.createElement('div');
      d.className = 'bar';
      d.style.left = `${bbox.left + offsetX}px`;
      d.style.top = `${bbox.top + offsetY}px`;
      d.style.height = `${bbox.bottom - bbox.top}px`;
      d.style.width = `${bbox.right - bbox.left}px`;
      div.appendChild(d);
    });
  }
};

export const setup = () => {
  div = document.createElement('div');
  div.id = 'selected-bars';
  document.body.appendChild(div);
  div.addEventListener('mousedown', e => {
    if (e.shiftKey) {
      store.setState({ selection: [0, 0, 0, 0] });
    }
  });

  ({
    offset: { x: offsetX, y: offsetY },
    scrollPos: { x: scrollPosX, y: scrollPosY },
  } = store.getState());

  const unsub1 = store.subscribe(
    (x: number) => {
      offsetX = x;
    },
    (state): number => state.offset.x
  );

  const unsub2 = store.subscribe(
    (y: number) => {
      offsetY = y;
    },
    (state): number => state.offset.y
  );

  const unsub3 = store.subscribe(
    (boundingBoxes: BoundingBoxMeasure[]) => {
      drawLoop(boundingBoxes);
    },
    state => state.boundingBoxes
  );

  return {
    cleanup: () => {
      unsub1();
      unsub2();
      unsub3();
    },
  };
};
