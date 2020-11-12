import sequencer from 'heartbeat-sequencer';
import { loadMIDIFile } from './heartbeat-utils';

const midiFileName = 'mozk545a_2-bars';
const midiFile = '../assets/mozk545a_2-bars.mid';
const instrumentName = 'TP00-PianoStereo';

export const setupSong = async () => {
  await sequencer.ready();
  // load MIDI file and setup song
  await loadMIDIFile(midiFile);
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
