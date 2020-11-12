import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import sequencer, {
  loadMusicXMLFile,
  MIDIEvent,
  MIDINote,
  Song,
  KeyEditor,
} from 'heartbeat-sequencer';
import {
  parseMusicXML,
  setGraphicalNoteColor,
  getGraphicalNotesPerMeasure,
  mapMIDINoteIdToGraphicalNote,
  getGraphicalNotesPerMeasurePerTrack,
  mapMIDINoteIdToGraphicalNotePerTrack,
  MusicSystemShim,
  getVersion,
  NoteMappingMIDIToGraphical,
  getSelectedMeasures,
  NoteMappingGraphicalToMIDI,
  GraphicalNoteData,
  BoundingBoxMeasure,
  getBoundingBoxesOfSelectedMeasures,
  ParsedMusicXML,
} from 'webdaw-modules';

import { State, store } from './store';

// const mxmlFile = '../assets/mozk545a_2-bars.musicxml';

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

const resize = () => {};

export const setupScore = async () => {
  const { ppq, currentMXMLFile } = store.getState();
  const element = document.createElement('div');
  element.className = 'unselectable';

  const osmd = new OpenSheetMusicDisplay(element, {
    backend: 'svg',
    autoResize: false,
  });
  console.log(`OSMD: ${osmd.Version}`);

  loadScore(osmd, currentMXMLFile, ppq);
  store.subscribe(
    (mxmlFile: string | null) => {
      if (mxmlFile !== null) {
        loadScore(osmd, mxmlFile, ppq);
      }
    },
    (state: State) => state.currentMXMLFile
  );

  return {
    element,
  };
};
