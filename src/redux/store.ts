import { createStore } from 'redux';
import {
  NoteMappingMIDIToGraphical,
  NoteMappingGraphicalToMIDI,
  GraphicalNoteData,
} from 'webdaw-modules';
import { Song } from 'heartbeat-sequencer';

export type RootState = {
  ppq: number;
  midiFileName: string;
  midiFile: string;
  xmlFile: string;
  instrumentName: string;
  instrumentOgg: string;
  instrumentMp3: string;
  midiToGraphical: NoteMappingMIDIToGraphical;
  graphicalToMidi: NoteMappingGraphicalToMIDI;
  graphicalNotesPerBar: GraphicalNoteData[][];
  song: Song;
  repeats: number[][];
  initialTempo: number;
  scoreDivOffsetX: number;
  scoreDivOffsetY: number;
  selectedBarNumbers: number[];
};

const instrumentName = 'TP00-PianoStereo';

const state = {
  ppq: 960,
  // midiFileName: 'mozk545a',
  // midiFile: '../assets/mozk545a.mid',
  // mxmlFile: '../assets/mozk545a_musescore.musicxml',
  midiFileName: 'mozk545a_2-bars',
  midiFile: '../assets/mozk545a_2-bars.mid',
  mxmlFile: '../assets/mozk545a_2-bars.musicxml',
  // midiFileName: 'spring',
  // midiFile: '../assets/spring.mid',
  // mxmlFile: '../assets/spring.xml',
  instrumentName: 'TP00-PianoStereo',
  instrumentOgg: `../assets/${instrumentName}.ogg.json`,
  instrumentMp3: `../assets/${instrumentName}.mp3.json`,
  midiToGraphical: null,
  graphicalToMidi: null,
  graphicalNotesPerBar: [],
  song: null,
  repeats: [],
  initialTempo: 120,
  scoreDivOffsetX: 0,
  scoreDivOffsetY: 0,
  selectedBarNumbers: [2, 3],
};
