import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';
import {
  getBoundingBoxesOfSelectedMeasures,
  getSelectedMeasures,
  parseMusicXML,
} from 'webdaw-modules';
import { store } from './store';
import { getBoundingBoxMeasureAllStaves } from './getBoundingBoxMeasureAllStaves';

let div: HTMLDivElement;
let scoreDiv: HTMLDivElement;
let osmd: OpenSheetMusicDisplay;

const render = (o: OpenSheetMusicDisplay) => {
  osmd = o;
  osmd.render();
  store.setState({ offset: { x: scoreDiv.offsetLeft, y: scoreDiv.offsetTop } });
};

export const getOSMD = (): OpenSheetMusicDisplay => osmd;

export const setup = async (divElem: HTMLDivElement): Promise<{ cleanup: () => void }> => {
  scoreDiv = divElem;
  const { mxmlFile, ppq } = store.getState();
  osmd = new OpenSheetMusicDisplay(scoreDiv, {
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

  const unsub5 = store.subscribe(
    () => {
      render(osmd);
      // updateMeasure(osmd, store.getState().currentBar);
      // const { selectedMeasures } = store.getState();
      // const boundingBoxes = getBoundingBoxesOfSelectedMeasures(selectedMeasures, osmd);
      // store.setState({ boundingBoxes });
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
