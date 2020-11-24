import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';
import {
  getBoundingBoxesOfGraphicalMeasures,
  getBoundingBoxesOfSelectedMeasures,
  getSelectedMeasures,
  hasOverlap,
  parseMusicXML,
} from 'webdaw-modules';
import { store } from './store';
import { getBoundingBoxMeasure } from './getBoundingBoxMeasure';

let div: HTMLDivElement;
let scoreDiv: HTMLDivElement;
let osmd: OpenSheetMusicDisplay;

const render = (o: OpenSheetMusicDisplay) => {
  osmd = o;
  osmd.render();
  store.setState({ offset: { x: scoreDiv.offsetLeft, y: scoreDiv.offsetTop } });
};

const updateMeasure = (osmd: OpenSheetMusicDisplay, bar: number) => {
  const { x, y, width, height } = getBoundingBoxMeasure(osmd, bar);
  const {
    offset: { x: offsetX, y: offsetY },
    scrollPos: { x: scrollPosX, y: scrollPosY },
    currentBarDurationMillis,
  } = store.getState();
  store.setState({
    currentBarStartX: x,
    playhead: {
      x: x + offsetX + scrollPosX,
      y: y + offsetY + scrollPosY,
      width,
      height,
    },
    pixelsPerMillisecond: width / currentBarDurationMillis,
  });
};

export const getPositionInMeasure = (e: MouseEvent) => {
  const {
    offset: { x: offsetX, y: offsetY },
    scrollPos: { x: scrollPosX, y: scrollPosY },
  } = store.getState();
  const x = e.clientX + offsetX + scrollPosX;
  const y = e.clientY + offsetY + scrollPosY;
  const boxes = getBoundingBoxesOfGraphicalMeasures(osmd);

  for (let i = 0; i < boxes.length; i++) {
    const staves = boxes[i];
    const yPos = [];
    const xPos = [];
    let box;
    for (let j = 0; j < staves.length; j++) {
      box = staves[j];
      xPos.push(box.left, box.right);
      yPos.push(box.top, box.bottom);
    }
    if (box) {
      const xMin = Math.min(...xPos) + offsetX;
      const xMax = Math.max(...xPos) + offsetX;
      const yMin = Math.min(...yPos) + offsetY;
      const yMax = Math.max(...yPos) + offsetY;
      const ref1 = {
        x: xMin,
        left: xMin,
        right: xMax,
        y: yMin,
        top: yMin,
        bottom: yMax,
        width: 0,
        height: 0,
        measureNumber: box.measureNumber,
      };
      const ref2 = {
        top: y,
        bottom: y + 2,
        left: x,
        right: x + 2,
        x,
        y,
        width: 2,
        height: 2,
      };
      const hit = hasOverlap(ref1, ref2);
      // console.log(ref1, ref2);
      if (hit) {
        store.setState({ currentBar: ref1.measureNumber });
        div.style.left = `${ref1.left}px`;
        div.style.top = `${ref1.top}px`;
        div.style.height = `${ref1.bottom - ref1.top}px`;
        div.style.width = `${ref1.right - ref1.left}px`;
        div.style.display = 'block';
        // console.log(ref1.measureNumber);
        return;
      }
    }
  }
};

export const setup = async (divElem: HTMLDivElement): Promise<{ cleanup: () => void }> => {
  scoreDiv = divElem;
  div = document.createElement('div');
  div.id = 'selected-measure';
  document.body.appendChild(div);
  const { mxmlFile, ppq } = store.getState();
  const osmd = new OpenSheetMusicDisplay(scoreDiv, {
    backend: 'svg',
    autoResize: false,
  });

  console.log(`OSMD: ${osmd.Version}`);

  const xmlDoc = await loadMusicXMLFile(mxmlFile);
  const parsed = parseMusicXML(xmlDoc, ppq);
  const { repeats, initialTempo } = parsed as any;
  store.setState({ repeats, initialTempo });

  await osmd.load(xmlDoc);
  // osmd.GraphicSheet.MeasureList.forEach((measure, measureNumber) => {
  //   console.log(measure, measureNumber);
  // });

  const unsub1 = store.subscribe(
    (bar: number) => {
      updateMeasure(osmd, bar);
    },
    state => state.currentBar
  );

  const unsub2 = store.subscribe(
    (bar: number) => {
      updateMeasure(osmd, bar);
    },
    state => state.currentBarScore
  );

  const unsub3 = store.subscribe(
    (selectionRectangle: number[]) => {
      const {
        offset: { x: offsetX, y: offsetY },
        scrollPos: { x: scrollPosX, y: scrollPosY },
      } = store.getState();
      const { barNumbers, boundingBoxes } = getSelectedMeasures(
        osmd,
        {
          x: selectionRectangle[0] + scrollPosX - offsetX,
          y: selectionRectangle[1] + scrollPosY - offsetY,
        },
        {
          x: selectionRectangle[2] + scrollPosX - offsetX,
          y: selectionRectangle[3] + scrollPosY - offsetY,
        }
      );
      // console.log(barNumbers);
      store.setState({ boundingBoxes, selectedMeasures: barNumbers });
    },
    (state): number[] => state.selection
  );

  const unsub4 = store.subscribe(
    (loaded: boolean) => {
      if (loaded) {
        const bar = store.getState().currentBar;
        updateMeasure(osmd, bar);
        // console.log('updateMeasure');
      }
    },
    (state): boolean => state.loaded
  );

  const unsub5 = store.subscribe(
    () => {
      render(osmd);
      updateMeasure(osmd, store.getState().currentBar);
      const { selectedMeasures } = store.getState();
      const boundingBoxes = getBoundingBoxesOfSelectedMeasures(selectedMeasures, osmd);
      store.setState({ boundingBoxes });
    },
    state => state.width
  );

  render(osmd);

  return {
    cleanup: () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    },
  };
};
