import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';
import { getBoundingBoxesOfSelectedMeasures, getSelectedMeasures } from 'webdaw-modules';
import { store } from './store';
import { getBoundingBoxMeasure } from './getBoundingBoxMeasure';

let scoreDiv: HTMLDivElement;

const render = (osmd: OpenSheetMusicDisplay) => {
  osmd.render();
  store.setState({ offsetX: scoreDiv.offsetLeft, offsetY: scoreDiv.offsetTop });
};

const updateMeasure = (osmd: OpenSheetMusicDisplay, bar: number) => {
  const { x, y, width, height } = getBoundingBoxMeasure(osmd, bar);
  const { offsetX, offsetY, scrollPos, currentBarDurationMillis } = store.getState();
  store.setState({
    currentBarStartX: x,
    playhead: {
      x: x + offsetX,
      y: y + offsetY + scrollPos,
      width,
      height,
    },
    pixelsPerMillisecond: width / currentBarDurationMillis,
  });
};

export const getPositionInMeasure = (e: MouseEvent) => {
  const x = e.clientX;
  const y = e.clientY;
};

export const setup = async (div: HTMLDivElement): Promise<{ cleanup: () => void }> => {
  scoreDiv = div;
  const { mxmlFile, ppq } = store.getState();
  const osmd = new OpenSheetMusicDisplay(scoreDiv, {
    backend: 'svg',
    autoResize: false,
  });

  console.log(`OSMD: ${osmd.Version}`);

  const xmlDoc = await loadMusicXMLFile(mxmlFile);
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
    (selectionRectangle: number[]) => {
      const { offsetX, offsetY, scrollPos } = store.getState();
      const { barNumbers, boundingBoxes } = getSelectedMeasures(
        osmd,
        {
          x: selectionRectangle[0] - offsetX,
          y: selectionRectangle[1] + scrollPos - offsetY,
        },
        {
          x: selectionRectangle[2] - offsetX,
          y: selectionRectangle[3] + scrollPos - offsetY,
        }
      );
      console.log(barNumbers);
      store.setState({ boundingBoxes, selectedMeasures: barNumbers });
    },
    (state): number[] => state.selection
  );

  const unsub3 = store.subscribe(
    (loaded: boolean) => {
      if (loaded) {
        const bar = store.getState().currentBar;
        updateMeasure(osmd, bar);
        // console.log('updateMeasure');
      }
    },
    (state): boolean => state.loaded
  );

  const unsub4 = store.subscribe(
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
    },
  };
};
