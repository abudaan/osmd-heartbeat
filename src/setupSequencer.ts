import sequencer from 'heartbeat-sequencer';
import { loadJSON, addAssetPack } from './heartbeat-utils';

const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `../assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `../assets/${instrumentName}.mp3.json`;

export const setupSequencer = async () => {
  await sequencer.ready();
  // load instrument
  let url = instrumentMp3;
  if (sequencer.browser === 'firefox') {
    url = instrumentOgg;
  }
  const json = await loadJSON(url);
  await addAssetPack(json);
};
