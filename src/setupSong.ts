import sequencer from 'heartbeat-sequencer';
import { loadMIDIFile } from './heartbeat-utils';
import { store } from './store';

// load MIDI file and setup song
const load = async (midiFile: string, instrumentName: string) => {
  await loadMIDIFile(midiFile);
  const midiFileName = midiFile.substring(midiFile.lastIndexOf('/'), midiFile.lastIndexOf('.mid'));
  console.log('midiFileName', midiFileName);
  const song = sequencer.createSong(sequencer.getMidiFile(midiFileName));
  const keyEditor = sequencer.createKeyEditor(song, {});
  song.tracks.forEach(track => {
    // console.log(track.id);
    track.setInstrument(instrumentName);
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
        await load(midiFile, instrumentName);
      }
    },
    state => [state.currentMIDIFile, state.instrumentName]
  );
  const { currentMIDIFile, instrumentName, storeSong } = store.getState();
  const { song, keyEditor } = await load(currentMIDIFile, instrumentName);
  storeSong(song, keyEditor);
  return {
    song,
    keyEditor,
  };
};
