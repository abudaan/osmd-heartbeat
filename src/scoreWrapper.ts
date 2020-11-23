import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';
import { getSelectedMeasures } from 'webdaw-modules';
import { store } from './store';
import { getBoundingBoxMeasure } from './getBoundingBoxMeasure';

const scoreDiv = document.getElementById('score');
const loadingDiv = document.getElementById('loading');

if (scoreDiv === null || loadingDiv === null) {
  throw new Error('element not found');
}

const { mxmlFile, ppq } = store.getState();
const osmd = new OpenSheetMusicDisplay(scoreDiv, {
  backend: 'svg',
  autoResize: false,
});

const render = (osmd: OpenSheetMusicDisplay) => {
  osmd.render();
  store.setState({ offsetX: scoreDiv.offsetLeft, offsetY: scoreDiv.offsetTop });
};

const updateMeasure = (bar: number) => {
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

export const setup = async (): Promise<{ cleanup: () => void }> => {
  console.log(`OSMD: ${osmd.Version}`);

  const xmlDoc = await loadMusicXMLFile(mxmlFile);
  await osmd.load(xmlDoc);
  // osmd.GraphicSheet.MeasureList.forEach((measure, measureNumber) => {
  //   console.log(measure, measureNumber);
  // });

  const unsub1 = store.subscribe(
    loaded => {
      if (loaded === true) {
        loadingDiv.style.display = 'none';
      }
    },
    state => state.loaded
  );

  const unsub2 = store.subscribe(
    (bar: number) => {
      updateMeasure(bar);
    },
    state => state.currentBar
  );

  const unsub3 = store.subscribe(
    (selectionRectangle: number[]) => {
      const { barNumbers, boundingBoxes } = getSelectedMeasures(
        osmd,
        {
          x: selectionRectangle[0],
          y: selectionRectangle[1],
        },
        {
          x: selectionRectangle[2],
          y: selectionRectangle[3],
        }
      );
      store.setState({ boundingBoxes });
    },
    (state): number[] => state.selection
  );

  const unsub4 = store.subscribe(
    (loaded: boolean) => {
      if (loaded) {
        const bar = store.getState().currentBar;
        updateMeasure(bar);
        // console.log('updateMeasure');
      }
    },
    (state): boolean => state.loaded
  );

  const unsub5 = store.subscribe(
    () => {
      render(osmd);
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
