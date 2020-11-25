import sequencer from 'heartbeat-sequencer';
import { BoundingBoxMeasure } from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';
import { store } from './store';

const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `../assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `../assets/${instrumentName}.mp3.json`;

let raqId: number;
let song: Heartbeat.Song;
let repeats: number[][] = [];
let keyEditor: Heartbeat.KeyEditor;
let hasRepeated: { [index: number]: boolean } = {};

const updateSongPosition = () => {
  store.setState({ currentPosition: song.millis });
  raqId = requestAnimationFrame(updateSongPosition);
};

const checkRepeat = () => {
  let bar = song.bar;

  if (!repeats.length) {
    return song.bar;
  }

  repeats.forEach((repeat, i) => {
    if (song.bar === repeat[1]) {
      if (hasRepeated[i] !== true) {
        bar = repeat[0] - 1;
        hasRepeated[i] = true;
      }
    }
  });

  return bar;
};

const updateBar = () => {
  // console.log('updateBar', song.bar);
  const startMillis = (song.getPosition('barsandbeats', song.bar, 0, 0, 0) as any).millis;
  const endMillis = (song.getPosition('barsandbeats', song.bar + 1, 0, 0, 0) as any).millis;
  store.setState({
    currentBar: song.bar,
    currentBarScore: checkRepeat(),
    currentBarDurationMillis: endMillis - startMillis,
    currentBarStartMillis: startMillis,
  });
};

const stopSong = () => {
  store.setState({ songState: 'stop' });
  cancelAnimationFrame(raqId);
  updateBar();
  hasRepeated = {};
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

  song.addEventListener('end', stopSong);

  song.addEventListener('position', 'bar', updateBar);

  const unsub1 = store.subscribe(
    songState => {
      if (songState === 'stop') {
        song.stop();
        setTimeout(() => {
          stopSong();
        }, 10);
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

  const unsub3 = store.subscribe(
    (bar: number) => {
      console.log(bar);
      // if (currentBar !== song.bar) {
      const { millis } = song.getPosition('barsandbeats', bar, 0, 0, 0) as any;
      song.setPlayhead('millis', millis);
      // }
    },
    state => state.currentBarSong
  );

  const unsub4 = store.subscribe(
    (r: number[][]) => {
      repeats = r;
    },
    state => state.repeats
  );
  updateBar();

  return {
    cleanup: () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    },
  };
};
