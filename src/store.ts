import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay/build/dist/src';
import create from 'zustand/vanilla';

export type State = {
  ppq: number;
  field: number;
  something: any;
  mxmlFiles: {
    name: string;
    doc: XMLDocument;
  }[];
  currentMXMLFile: string;
  midiFiles: {
    name: string;
    file: Heartbeat.Song;
  }[];
  currentMIDIFile: string;
  instrumentName: string;
  scoreDivOffsetX: number;
  scoreDivOffsetY: number;
  nonSerializable: {
    osmd?: OpenSheetMusicDisplay;
    song?: Heartbeat.Song;
    keyEditor?: Heartbeat.KeyEditor;
  };
};

export type Reducers = {
  storeOSMD: (osmd: OpenSheetMusicDisplay) => void;
  storeSong: (song: Heartbeat.Song, keyEditor: Heartbeat.KeyEditor) => void;
  setField: (val: number) => void;
  getField: () => number;
  setField2: (val: number) => void;
  loadSomething: (url: string) => Promise<void>;
  // hydrate: (state: State) => void;
  // dehydrate: () => State;
};

export type Store = State & Reducers;

export const store = create<Store>((set, get) => ({
  ppq: 960,
  mxmlFiles: [],
  midiFiles: [],
  currentMIDIFile: '../assets/mozk545a_2-bars.mid',
  currentMXMLFile: '../assets/mozk545a_2-bars.musicxml',
  instrumentName: 'TP00-PianoStereo',
  scoreDivOffsetX: 0,
  scoreDivOffsetY: 0,
  field: 0,
  something: null,
  nonSerializable: {},
  storeOSMD: (osmd: OpenSheetMusicDisplay) => {
    set(state => ({
      nonSerializable: {
        ...state.nonSerializable,
        osmd,
      },
    }));
  },
  storeSong: (song: Heartbeat.Song, keyEditor: Heartbeat.KeyEditor) => {
    set(state => ({
      nonSerializable: {
        ...state.nonSerializable,
        song,
        keyEditor,
      },
    }));
  },
  setField: (val: number) => {
    set({ field: val });
  },
  getField: () => {
    return get().field;
  },
  setField2: (val: number) => {
    set(state => {
      if (state.field > 3) {
        return state;
      } else {
        return { field: val };
      }
    });
  },
  loadSomething: async (url: string) => {
    const data = await fetch(url).then(response => response.json());
    set({ something: data });
  },
  // hydrate: (state: State) => {
  //   set({ ...state });
  // },
  // dehydrate: () => {
  //   return {
  //     ppq: get().ppq,
  //     field: get().field,
  //     something: get().something,
  //     mxmlFiles: get().mxmlFiles,
  //     midiFiles: get().midiFiles,
  //     currentMXMLFile: get().currentMXMLFile,
  //     currentMIDIFile: get().currentMIDIFile,
  //   };
  // },
}));
