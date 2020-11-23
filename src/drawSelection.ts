import { BoundingBox, BoundingBoxMeasure } from 'webdaw-modules';
import { store } from './store';

let element: HTMLElement;
const selectionDiv = document.getElementById('selection');
const selectedBarsDiv = document.getElementById('selected-bars');
const selectionStartPoint: { x: number; y: number } = { x: -1, y: -1 };
const selectionEndPoint: { x: number; y: number } = { x: -1, y: -1 };

if (selectionDiv === null || selectedBarsDiv === null) {
  throw new Error('element not found');
}

let offsetX: number;
let offsetY: number;
let scrollPos: number;

// draw rectangles on the score to indicate the set loop
const drawLoop = (boundingBoxes: BoundingBoxMeasure[]) => {
  // selectedBarsDiv.style.display = 'none';
  while (selectedBarsDiv.firstChild) {
    selectedBarsDiv.removeChild(selectedBarsDiv.firstChild);
  }
  if (boundingBoxes.length > 0) {
    selectedBarsDiv.style.display = 'block';
    boundingBoxes.forEach(bbox => {
      const d = document.createElement('div');
      d.className = 'bar';
      d.style.left = `${bbox.left + offsetX}px`;
      d.style.top = `${bbox.top + offsetY}px`;
      d.style.height = `${bbox.bottom - bbox.top}px`;
      d.style.width = `${bbox.right - bbox.left}px`;
      selectedBarsDiv.appendChild(d);
    });
  }
};

const drawSelect = (e: MouseEvent) => {
  selectionDiv.style.left = `${selectionStartPoint.x}px`;
  selectionDiv.style.top = `${selectionStartPoint.y + scrollPos}px`;
  selectionDiv.style.width = `${e.clientX - selectionStartPoint.x}px`;
  selectionDiv.style.height = `${e.clientY - selectionStartPoint.y}px`;
  selectionEndPoint.x = e.clientX;
  selectionEndPoint.y = e.clientY;
};

const stopSelect = (e: MouseEvent) => {
  // document.removeEventListener('mousedown', startSelect);
  element.removeEventListener('mouseup', stopSelect);
  element.removeEventListener('mousemove', drawSelect);
  selectionDiv.style.display = 'none';
  selectionDiv.style.left = '0px';
  selectionDiv.style.top = '0px';
  selectionDiv.style.width = '0px';
  selectionDiv.style.height = '0px';
  store.setState({
    selection: [ selectionStartPoint.x, selectionStartPoint.y, selectionEndPoint.x, selectionEndPoint.y, ],
  });
};

export const startSelect = (e: MouseEvent) => {
  selectionStartPoint.x = e.clientX;
  selectionStartPoint.y = e.clientY;
  selectionDiv.style.display = 'block';
  element.addEventListener('mouseup', stopSelect);
  element.addEventListener('mousemove', drawSelect);
};

export const setup = (el: HTMLElement) => {
  element = el;
  ({ offsetX, offsetY, scrollPos } = store.getState());

  const unsub1 = store.subscribe(
    (x: number) => {
      offsetX = x;
    },
    (state): number => state.offsetX
  );

  const unsub2 = store.subscribe(
    (y: number) => {
      offsetY = y;
    },
    (state): number => state.offsetY
  );

  const unsub3 = store.subscribe(
    (s: number) => {
      scrollPos = s;
    },
    (state): number => state.scrollPos
  );

  const unsub4 = store.subscribe(
    (boundingBoxes: BoundingBox[]) => {
      drawLoop(boundingBoxes);
    },
    (state): BoundingBox[] => state.boundingBoxes
  );

  return {
    cleanup: () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    },
  };
};
