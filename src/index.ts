import { OpenSheetMusicDisplay, GraphicalVoiceEntry } from 'opensheetmusicdisplay';
import sequencer, { loadMusicXMLFile, MIDIEvent, Song } from 'heartbeat-sequencer';
import {
  parseMusicXML,
  setGraphicalNoteColor,
  getGraphicalNotesPerBar,
  mapMIDINoteIdToGraphicalNote,
  MusicSystemShim,
  getVersion,
  NoteMappingMIDIToGraphical,
  getSelectedMeasures,
  getSelectedMeasureBoundingBoxes,
  NoteMappingGraphicalToMIDI,
  GraphicalNoteData,
  GraphicalMeasureShim,
} from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';
import { resize } from './resize';

const ppq = 960;
// const midiFileName = 'mozk545a';
// const midiFile = '../assets/mozk545a.mid';
// const mxmlFile = '../assets/mozk545a_musescore.musicxml';
const midiFileName = 'mozk545a_2-bars';
const midiFile = '../assets/mozk545a_2-bars.mid';
const mxmlFile = '../assets/mozk545a_2-bars.musicxml';
// const midiFileName = 'spring';
// const midiFile = '../assets/spring.mid';
// const mxmlFile = '../assets/spring.xml';
const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `../assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `../assets/${instrumentName}.mp3.json`;
let midiToGraphical: NoteMappingMIDIToGraphical;
let graphicalToMidi: NoteMappingGraphicalToMIDI;
let graphicalNotesPerBar: GraphicalNoteData[][];
let song: Song;
let repeats: number[][];
let initialTempo: number;
let scoreDivOffsetX: number = 0;
let scoreDivOffsetY: number = 0;
let selectedBarNumbers: number[] = [2, 3];

const btnPlay = document.getElementById('play') as HTMLButtonElement;
const btnStop = document.getElementById('stop') as HTMLButtonElement;
const scoreDiv = document.getElementById('score');
const loadingDiv = document.getElementById('loading');
const selectionDiv = document.getElementById('selection');
const selectedBarsDiv = document.getElementById('selected-bars');
if (scoreDiv === null || selectionDiv === null || loadingDiv === null || selectedBarsDiv === null) {
  throw new Error('element not found');
}

const osmd = new OpenSheetMusicDisplay(scoreDiv, {
  backend: 'svg',
  autoResize: false,
});
console.log(`OSMD: ${osmd.Version}`);
console.log(`WebDAW: ${getVersion()}`);

// reset all highlighted notes
const resetScore = () => {
  Object.values(midiToGraphical).forEach(g => {
    const { element } = g;
    setGraphicalNoteColor(element, 'black');
  });
};

const init = async () => {
  await sequencer.ready();
  // load MIDI file and setup song
  await loadMIDIFile(midiFile);
  song = sequencer.createSong(sequencer.getMidiFile(midiFileName));
  // load instrument and setup all tracks
  let url = instrumentMp3;
  if (sequencer.browser === 'firefox') {
    url = instrumentOgg;
  }
  const json = await loadJSON(url);
  await addAssetPack(json);
  song.tracks.forEach(track => {
    track.setInstrument(instrumentName);
  });
  // load MusicXML
  const xmlDoc = await loadMusicXMLFile(mxmlFile);
  await osmd.load(xmlDoc);

  // parse the MusicXML file to find where the song repeats
  const parsed = parseMusicXML(xmlDoc, ppq);
  if (parsed === null) {
    return;
  }
  ({ repeats, initialTempo } = parsed);
  // the score gets rendered every time the window resizes; here we force the first render
  await resize({ osmd, scoreDiv });

  // setup controls
  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
  });

  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
  });

  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
  });

  btnPlay.addEventListener('click', e => {
    e.stopImmediatePropagation();
    if (song.playing) {
      song.pause();
    } else {
      song.play();
    }
  });

  btnStop.addEventListener('click', e => {
    e.stopImmediatePropagation();
    song.stop();
    resetScore();
  });

  // everything has been setup so we can enable the buttons
  btnPlay.disabled = false;
  btnStop.disabled = false;
  loadingDiv.style.display = 'none';

  window.addEventListener('resize', async () => {
    await resize({ osmd, scoreDiv });
  });

  // song.setTempo(200);
  document.addEventListener('mousedown', startSelect);
};

init();
