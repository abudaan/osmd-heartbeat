import sequencer from 'heartbeat-sequencer';
// import { EqualityChecker } from 'zustand';
import { loadMIDIFile } from './heartbeat-utils';
import { store } from './store';

// load MIDI file and setup song
const load = async (midiFile: string, instrumentName: string) => {
  console.log('LOAD', midiFile, instrumentName);
  await loadMIDIFile(midiFile);
  const midiFileName = midiFile.substring(
    midiFile.lastIndexOf('/') + 1,
    midiFile.lastIndexOf('.mid')
  );
  // console.log('midiFileName', midiFileName);
  //delete song
  const oldSong = store.getState().nonSerializable.song;
  if (oldSong) {
    sequencer.deleteSong(oldSong);
  }
  const song = sequencer.createSong(sequencer.getMidiFile(midiFileName));
  const keyEditor = sequencer.createKeyEditor(song, {});
  song.tracks.forEach(track => {
    // console.log(track.id);
    track.setInstrument(instrumentName);
  });

  song.addEventListener('stop', () => {
    document.dispatchEvent(new CustomEvent('song', { detail: { transport: 'stop' } }));
  });
  song.addEventListener('pause', () => {
    document.dispatchEvent(new CustomEvent('song', { detail: { transport: 'pause' } }));
  });
  song.addEventListener('play', () => {
    document.dispatchEvent(new CustomEvent('song', { detail: { transport: 'play' } }));
  });
  song.addEventListener('end', () => {
    document.dispatchEvent(new CustomEvent('song', { detail: { transport: 'end' } }));
  });

  return {
    song,
    keyEditor,
  };
};

export const setupSong = async (): Promise<{
  song: Heartbeat.Song;
  keyEditor: Heartbeat.KeyEditor;
}> => {
  await sequencer.ready();
  store.subscribe(
    async (data: string[] | null) => {
      if (data !== null) {
        const [midiFile, instrumentName] = data;
        console.log('SUBSCRIBE', midiFile, instrumentName);
        await load(midiFile, instrumentName);
      }
    },
    state => [state.currentMIDIFile, state.instrumentName],
    (a: string[], b: unknown) => {
      const b1 = b as string[];
      return a[0] === b1[0];
    }
  );
  const { currentMIDIFile, instrumentName, storeSong } = store.getState();
  const { song, keyEditor } = await load(currentMIDIFile, instrumentName);
  storeSong(song, keyEditor);
  return {
    song,
    keyEditor,
  };
};
