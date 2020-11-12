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
  Repeat,
} from 'webdaw-modules';

import { State, store } from './store';

let osmd: OpenSheetMusicDisplay;
let scoreDiv: HTMLDivElement;

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

type Args = {
  osmd: OpenSheetMusicDisplay;
  ppq: number;
  repeats: number[][];
};
const resize = ({ osmd, ppq, repeats }: Args) => {
  osmd.render();
  store.setState({
    scoreDivOffsetX: scoreDiv.offsetLeft,
    scoreDivOffsetY: scoreDiv.offsetTop,
  });

  const textElements = document.getElementsByTagName('text');
  for (let i = 0; i < textElements.length; i++) {
    const el = textElements[i];
    if (el.innerHTML === 'f') {
      el.setAttribute('font-weight', 'normal');
      el.setAttribute('font-style', 'normal');
    }
  }

  // const graphicalNotesPerBarPerTrack = getGraphicalNotesPerMeasurePerTrack(osmd, ppq);
  // console.log(graphicalNotesPerBarPerTrack);
  // const mappings: {
  //   // score: number;
  //   midiToGraphical: NoteMappingMIDIToGraphical;
  //   graphicalToMidi: NoteMappingGraphicalToMIDI;
  // }[] = mapMIDINoteIdToGraphicalNotePerTrack(graphicalNotesPerBarPerTrack, repeats, song.notes);
  // // console.log(mappings);

  // mappings.forEach(mapping => {
  //   midiToGraphical = {
  //     ...midiToGraphical,
  //     ...mapping.midiToGraphical,
  //   };
  //   graphicalToMidi = {
  //     ...graphicalToMidi,
  //     ...mapping.graphicalToMidi,
  //   };
  // });
};

export const setupScore = async (parent: HTMLElement) => {
  const { ppq, currentMXMLFile } = store.getState();
  scoreDiv = document.createElement('div');
  scoreDiv.className = 'unselectable';
  scoreDiv.id = 'score';

  osmd = new OpenSheetMusicDisplay(scoreDiv, {
    backend: 'svg',
    autoResize: false,
  });
  console.log(`OSMD: ${osmd.Version}`);

  const data = await loadScore(osmd, currentMXMLFile, ppq);
  let repeats: number[][] = [];
  if (data !== null) {
    ({ repeats } = data);
  }
  store.subscribe(
    (mxmlFile: string | null) => {
      if (mxmlFile !== null) {
        loadScore(osmd, mxmlFile, ppq);
      }
    },
    (state: State) => state.currentMXMLFile
  );

  parent.append(scoreDiv);
  resize({ osmd, ppq, repeats });

  return {
    element: scoreDiv,
  };
};
