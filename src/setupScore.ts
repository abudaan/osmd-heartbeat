import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';
import { parseMusicXML, ParsedMusicXML } from 'webdaw-modules';
import { State, store } from './store';
import { resizeScore } from './resizeScore';

let osmd: OpenSheetMusicDisplay;

const loadScore = async (
  osmd: OpenSheetMusicDisplay,
  mxmlFile: string,
  ppq: number
): Promise<ParsedMusicXML> => {
  const xmlDoc = await loadMusicXMLFile(mxmlFile);
  osmd.load(xmlDoc);
  // parse the MusicXML file to find where the song repeats
  const parsed = parseMusicXML(xmlDoc, ppq);
  if (parsed === null) {
    return Promise.reject();
  }
  // const { repeats, initialTempo } = parsed;
  return parsed;
};

export const setupScore = async (
  scoreDiv: HTMLElement
): Promise<{ osmd: OpenSheetMusicDisplay }> => {
  const { ppq, currentMXMLFile, storeOSMD } = store.getState();

  osmd = new OpenSheetMusicDisplay(scoreDiv, {
    backend: 'svg',
    autoResize: false,
  });
  console.log(`OSMD: ${osmd.Version}`);

  store.subscribe(
    (mxmlFile: string | null) => {
      if (mxmlFile !== null) {
        loadScore(osmd, mxmlFile, ppq);
      }
    },
    (state: State) => state.currentMXMLFile
  );

  if (currentMXMLFile) {
    const data = await loadScore(osmd, currentMXMLFile, ppq);
    let repeats: number[][] = [];
    if (data !== null) {
      ({ repeats } = data);
    }

    resizeScore({ div: scoreDiv, osmd });
  }

  storeOSMD(osmd);
  return {
    osmd,
  };
};
