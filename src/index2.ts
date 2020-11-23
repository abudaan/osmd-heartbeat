import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import sequencer, {
  loadMusicXMLFile,
  MIDIEvent,
  MIDINote,
  Song,
  KeyEditor,
} from 'heartbeat-sequencer';
import {
  parseMusicXML,
  getVersion,
  getBoundingBoxesOfSelectedMeasures,
  getSelectedMeasures,
} from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';
import { midiFileName, midiFile, mxmlFile } from './files';
import { setup as setupDrawSelection, startSelect, drawLoop } from './drawSelection';
import { store } from './store';

const ppq = 960;
const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `../assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `../assets/${instrumentName}.mp3.json`;
let song: Song;
let keyEditor: KeyEditor;
let repeats: number[][];
let initialTempo: number;
let scoreDivOffsetX: number = 0;
let scoreDivOffsetY: number = 0;
let currentBarStartX: number = 0;
let currentBarStartMillis: number = 0;
let pixelsPerMilli: number = 0;
let selectedMeasures: number[] = [];
// for setting the scroll position of the page based on the song position
let scrollPos = 0;
let currentY = 0;
let reference = -1;
// requestAnimationFrame id for highlighting the active notes
let raqId: number;

store.subscribe(
  (selectionRectangle: number[]) => {
    const { barNumbers, boundingBoxes } = getSelectedMeasures(
      osmd,
      {
        x: selectionRectangle[0],
        y: selectionRectangle[1],
      },
      {
        x: selectionRectangle[2],
        y: selectionRectangle[3],
      }
    );

    selectedMeasures = barNumbers;
    // console.log(selectedMeasures, boundingBoxes);

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
    drawLoop(boundingBoxes);
  },
  (state): number[] => state.selection
);

const btnPlay = document.getElementById('play') as HTMLButtonElement;
const btnStop = document.getElementById('stop') as HTMLButtonElement;
const divPlayhead = document.getElementById('playhead') as HTMLDivElement;
const scoreDiv = document.getElementById('score');
const loadingDiv = document.getElementById('loading');

if (scoreDiv === null || loadingDiv === null) {
  throw new Error('element not found');
}

const osmd = new OpenSheetMusicDisplay(scoreDiv, {
  backend: 'svg',
  autoResize: false,
});
console.log(`OSMD: ${osmd.Version}`);
console.log(`WebDAW: ${getVersion()}`);

const resize = async () => {
  osmd.render();
  scoreDivOffsetX = scoreDiv.offsetLeft;
  scoreDivOffsetY = scoreDiv.offsetTop;
  store.setState({ offsetX: scoreDivOffsetX, offsetY: scoreDivOffsetY });
  // redraw loop selection
  const boundingBoxes = getBoundingBoxesOfSelectedMeasures(selectedMeasures, osmd);
  drawLoop(boundingBoxes);
  // osmd.GraphicSheet.MeasureList.forEach((measure, measureNumber) => {
  //   console.log(measure, measureNumber);
  // });
};

const setPlayhead = (args: { x: number; y: number; width: number; height: number }) => {
  const { x, y, width, height } = args;
  divPlayhead.style.top = `${y}px`;
  divPlayhead.style.left = `${x}px`;
  divPlayhead.style.width = `${width}px`;
  divPlayhead.style.height = `${height}px`;
};

const movePlayhead = () => {
  const relPos = song.millis - currentBarStartMillis;
  divPlayhead.style.left = `${scoreDivOffsetX + currentBarStartX + relPos * pixelsPerMilli}px`;
  raqId = requestAnimationFrame(movePlayhead);
};

const init = async () => {
  await sequencer.ready();
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
  await resize();
  // setup controls
  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
    cancelAnimationFrame(raqId);
  });

  song.addEventListener('pause', () => {
    btnPlay.innerHTML = 'play';
    cancelAnimationFrame(raqId);
  });

  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
    raqId = requestAnimationFrame(movePlayhead);
  });

  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
    cancelAnimationFrame(raqId);
  });

  song.addEventListener('position', 'bar', () => {
    const measures = osmd.GraphicSheet.MeasureList.find(e => e[0]['measureNumber'] === song.bar);
    if (measures) {
      const yPos: number[] = [];
      let x: number = 0;
      let y: number = 0;
      let width: number = 0;
      let height: number = 0;
      measures.forEach((m, i) => {
        const stave = m.stave;
        // console.log(i, stave);
        ({ x, y, width, height } = stave);
        yPos.push(y);
      });
      currentBarStartMillis = song.getPosition('barsandbeats', song.bar, 0, 0, 0).millis;
      const endMillis = song.getPosition('barsandbeats', song.bar + 1, 0, 0, 0).millis;
      const durationMillis = endMillis - currentBarStartMillis;
      currentBarStartX = x;
      pixelsPerMilli = width / durationMillis;

      const yMin = Math.min(...yPos);
      const yMax = Math.max(...yPos);
      // console.log(yMax, yMin, height, yMax - yMin + height);
      setPlayhead({
        x: x + scoreDivOffsetX,
        y: yMin + scoreDivOffsetY,
        width: 10,
        height: yMax - yMin + height,
      });
    }
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
    cancelAnimationFrame(raqId);
  });

  // everything has been setup so we can enable the buttons
  btnPlay.disabled = false;
  btnStop.disabled = false;
  loadingDiv.style.display = 'none';

  window.addEventListener('resize', async () => {
    await resize();
  });

  window.addEventListener('scroll', e => {
    scrollPos = window.scrollY;
    store.setState({ scrollPos });
  });
  document.addEventListener('keydown', e => {
    if (e.keyCode === 13) {
      if (song.playing) {
        song.pause();
      } else {
        song.play();
      }
    } else if (e.keyCode === 96) {
      song.stop();
    }
  });
  setupDrawSelection();
  document.addEventListener('mousedown', e => {
    if (e.ctrlKey) {
      startSelect(e);
    }
  });
};

init();
