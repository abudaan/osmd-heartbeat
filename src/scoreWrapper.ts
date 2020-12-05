import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';
import { parseMusicXML } from 'webdaw-modules';
import { store } from './store';
import { getBoundingBoxMeasureAll } from './utils/getBoundingBoxMeasure';

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

  const unsub1 = store.subscribe(
    () => {
      render(osmd);
      store.setState({ boundingBoxesMeasures: getBoundingBoxMeasureAll(osmd) });
    },
    state => state.width
  );

  render(osmd);
  store.setState({ boundingBoxesMeasures: getBoundingBoxMeasureAll(osmd) });

  return {
    cleanup: () => {
      unsub1();
    },
  };
};
