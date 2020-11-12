import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  getGraphicalNotesPerMeasurePerTrack,
  mapMIDINoteIdToGraphicalNotePerTrack,
  NoteMappingMIDIToGraphical,
  NoteMappingGraphicalToMIDI,
} from 'webdaw-modules';
import { State, store } from './store';

type Args = {
  osmd: OpenSheetMusicDisplay;
  ppq: number;
  repeats: number[][];
  song: Heartbeat.Song;
};
export const mapMidiToScore = ({ osmd, ppq, repeats, song }: Args) => {
  const graphicalNotesPerBarPerTrack = getGraphicalNotesPerMeasurePerTrack(osmd, ppq);
  console.log(graphicalNotesPerBarPerTrack);
  const mappings: {
    // score: number;
    midiToGraphical: NoteMappingMIDIToGraphical;
    graphicalToMidi: NoteMappingGraphicalToMIDI;
  }[] = mapMIDINoteIdToGraphicalNotePerTrack(graphicalNotesPerBarPerTrack, repeats, song.notes);
  // console.log(mappings);

  let midiToGraphical: NoteMappingMIDIToGraphical = {};
  let graphicalToMidi: NoteMappingGraphicalToMIDI = {};

  mappings.forEach(mapping => {
    midiToGraphical = {
      ...midiToGraphical,
      ...mapping.midiToGraphical,
    };
    graphicalToMidi = {
      ...graphicalToMidi,
      ...mapping.graphicalToMidi,
    };
  });
};
