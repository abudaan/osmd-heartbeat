import { getBarInfo } from './getBarInfo';
import { getBoundingBoxMeasureAllStaves } from './getBoundingBoxMeasureAllStaves';
import { getPositionInMeasure } from './getPositionInMeasure';
import { getOSMD } from './scoreWrapper';
import { getSong } from './songWrapper';
import { store } from './store';

const divPlayhead = document.getElementById('playhead') as HTMLDivElement;

const draw = (dim: { x: number; y: number; width: number; height: number }) => {
  const { x, y, width, height } = dim;
  const {
    offset: { x: offsetX, y: offsetY },
  } = store.getState();
  // console.log('draw', x, y);
  divPlayhead.style.top = `${y + offsetY}px`;
  divPlayhead.style.left = `${x + offsetX}px`;
  divPlayhead.style.width = '10px'; //`${playhead.width}px`;
  divPlayhead.style.height = `${height}px`;
};

export const setPlayheadByBarNumber = (bar: number) => {
  const { x, y, width, height } = getBoundingBoxMeasureAllStaves(getOSMD(), bar);
  draw({ x, y, width, height });
  store.setState({
    currentBarStartX: x,
    pixelsPerMillisecond: width / getBarInfo(getSong(), bar).durationMillis,
  });
};

export const setPlayheadByPointerEvent = (e: PointerEvent) => {
  const data = getPositionInMeasure(e, getOSMD());
  // console.log(data);
  if (data !== null) {
    const { x, y, height, width, measureNumber } = data;
    draw({ x, y, width, height });
    store.setState({
      currentBarStartX: x,
      pixelsPerMillisecond: width / getBarInfo(getSong(), measureNumber).durationMillis,
    });
  }
};

export const setup = () => {
  const unsub1 = store.subscribe(
    (bar: number) => {
      setPlayheadByBarNumber(bar);
    },
    state => state.currentBar
  );

  const unsub2 = store.subscribe(
    loaded => {
      if (loaded) {
        setPlayheadByBarNumber(getSong().bar);
      }
    },
    state => state.loaded
  );

  const unsub3 = store.subscribe(
    (currentPosition: number) => {
      const {
        offset: { x: offsetX },
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
