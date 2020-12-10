import sequencer from 'heartbeat-sequencer';
import { BoundingBoxMeasure } from 'webdaw-modules';
import { stopSong } from './actions/stopSong';
import { updateBar } from './actions/updateBar';
import { loadJSON, addAssetPack, loadMIDIFile } from './utils/heartbeat-utils';
import { store } from './store';
import { setSongPosition } from './actions/setSongPosition';

const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `./assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `./assets/${instrumentName}.mp3.json`;

let raqId: number;
let song: Heartbeat.Song;
let keyEditor: Heartbeat.KeyEditor;

const updateSongPosition = () => {
  setSongPosition(song.millis);
  raqId = requestAnimationFrame(updateSongPosition);
};

export const getSong = (): Heartbeat.Song => song;

export const setup = async (): Promise<{ cleanup: () => void }> => {
  await sequencer.ready();
  const { midiFileName, midiFile } = store.getState();

  // load MIDI file and setup song
  await loadMIDIFile(midiFile);
  song = sequencer.createSong(sequencer.getMidiFile(midiFileName));
  keyEditor = sequencer.createKeyEditor(song, {});

  // load instrument and setup all tracks
  let url = instrumentMp3;
  if (sequencer.browser === 'firefox') {
    url = instrumentOgg;
  }
  const json = await loadJSON(url);
  await addAssetPack(json);
  song.tracks.forEach(track => {
    // console.log(track.id);
    track.setInstrument(instrumentName);
  });

  song.addEventListener('end', () => {
    cancelAnimationFrame(raqId);
    stopSong();
  });

  song.addEventListener('position', 'bar', updateBar);

  const unsub1 = store.subscribe(
    songState => {
      if (songState === 'stop') {
        song.stop();
      } else if (songState === 'play') {
        song.play();
        raqId = requestAnimationFrame(updateSongPosition);
      } else if (songState === 'pause') {
        song.pause();
        cancelAnimationFrame(raqId);
      }
    },
    state => state.songState
  );

  const unsub2 = store.subscribe(
    (boundingBoxes: BoundingBoxMeasure[]) => {
      if (boundingBoxes.length > 0) {
        let left = boundingBoxes[0].measureNumber;
        let right = boundingBoxes[boundingBoxes.length - 1].measureNumber + 1;
        const leftPos = song.getPosition('barsbeats', left, 1, 1, 0);
        const rightPos = song.getPosition('barsbeats', right, 1, 1, 0);
        song.setLeftLocator('ticks', leftPos.ticks);
        song.setRightLocator('ticks', rightPos.ticks);
        song.setPlayhead('ticks', leftPos.ticks);
        song.setLoop(true);
      } else {
        song.setLoop(false);
      }
    },
    state => state.boundingBoxes
  );

  return {
    cleanup: () => {
      unsub1();
      unsub2();
    },
  };
};
