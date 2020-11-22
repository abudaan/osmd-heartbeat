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
  setGraphicalNoteColor,
  MusicSystemShim,
  getVersion,
  NoteMappingMIDIToGraphical,
  getSelectedMeasures,
  getBoundingBoxesOfSelectedMeasures,
  NoteMappingGraphicalToMIDI,
  GraphicalNoteData,
  BoundingBoxMeasure,
} from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';

const ppq = 960;
// const midiFileName = 'mozk545a_musescore';
// const midiFile = '../assets/mozk545a_musescore.mid';
// const mxmlFile = '../assets/mozk545a_musescore.musicxml';
// const midiFileName = 'spring';
// const midiFile = '../assets/spring.mid';
// const mxmlFile = '../assets/spring.xml';
// const midiFileName = 'mozk545a_2-bars';
// const midiFile = '../assets/mozk545a_2-bars.mid';
// const mxmlFile = '../assets/mozk545a_2-bars.musicxml';
const midiFileName = 'Canon_in_D__Pachelbel__Guitar_Tab';
const midiFile = '../assets/Canon_in_D__Pachelbel__Guitar_Tab.mid';
const mxmlFile = '../assets/Canon_in_D__Pachelbel__Guitar_Tab.musicxml';
// const midiFileName = 'mozk545a_2-bars_2-tracks';
// const midiFile = '../assets/mozk545a_2-bars_2-tracks.mid';
// const mxmlFile = '../assets/mozk545a_2-bars.musicxml';
// const midiFileName = '3b中華色彩s-花非花 (full score)';
// const midiFile = '../assets/3b中華色彩s-花非花 (full score).mid';
// const mxmlFile = '../assets/3b中華色彩s-花非花 (vocal score).musicxml';
// const midiFileName = 'full-score';
// const midiFile = '../assets/full-score.mid';
// const mxmlFile = '../assets/vocal-score.musicxml';
// const midiFileName = 'mozk545a_4-bars';
// const midiFile = '../assets/mozk545a_4-bars.mid';
// const mxmlFile = '../assets/mozk545a_4-bars.musicxml';
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

const btnPlay = document.getElementById('play') as HTMLButtonElement;
const btnStop = document.getElementById('stop') as HTMLButtonElement;
const divPlayhead = document.getElementById('playhead') as HTMLDivElement;
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

// draw rectangles on the score to indicate the set loop
const drawLoop = (boundingBoxes: BoundingBoxMeasure[]) => {
  // selectedBarsDiv.style.display = 'none';
  while (selectedBarsDiv.firstChild) {
    selectedBarsDiv.removeChild(selectedBarsDiv.firstChild);
  }
  if (boundingBoxes.length > 0) {
    selectedBarsDiv.style.display = 'block';
    boundingBoxes.forEach(bbox => {
      const d = document.createElement('div');
      d.className = 'bar';
      d.style.left = `${bbox.left + scoreDivOffsetX}px`;
      d.style.top = `${bbox.top + scoreDivOffsetY}px`;
      d.style.height = `${bbox.bottom - bbox.top}px`;
      d.style.width = `${bbox.right - bbox.left}px`;
      selectedBarsDiv.appendChild(d);
    });
  }
};

const resize = async () => {
  osmd.render();
  scoreDivOffsetX = scoreDiv.offsetLeft;
  scoreDivOffsetY = scoreDiv.offsetTop;
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
  divPlayhead.style.left = `${currentBarStartX + relPos * pixelsPerMilli}px`;
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
    // const s = keyEditor.getSnapshot('keyeditor');
    // const n = s.notes.active[0];
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

  const selectionStartPoint: { x: number; y: number } = { x: -1, y: -1 };
  const selectionEndPoint: { x: number; y: number } = { x: -1, y: -1 };
  const drawSelect = (e: MouseEvent) => {
    selectionDiv.style.left = `${selectionStartPoint.x}px`;
    selectionDiv.style.top = `${selectionStartPoint.y + scrollPos}px`;
    selectionDiv.style.width = `${e.clientX - selectionStartPoint.x}px`;
    selectionDiv.style.height = `${e.clientY - selectionStartPoint.y}px`;
    selectionEndPoint.x = e.clientX;
    selectionEndPoint.y = e.clientY;
  };

  const stopSelect = (e: MouseEvent) => {
    // document.removeEventListener('mousedown', startSelect);
    document.removeEventListener('mouseup', stopSelect);
    document.removeEventListener('mousemove', drawSelect);
    selectionDiv.style.display = 'none';
    selectionDiv.style.left = '0px';
    selectionDiv.style.top = '0px';
    selectionDiv.style.width = '0px';
    selectionDiv.style.height = '0px';
    const { barNumbers, boundingBoxes } = getSelectedMeasures(
      osmd,
      {
        x: selectionStartPoint.x - scoreDivOffsetX,
        y: selectionStartPoint.y - scoreDivOffsetY + scrollPos,
      },
      {
        x: selectionEndPoint.x - scoreDivOffsetX,
        y: selectionEndPoint.y - scoreDivOffsetY + scrollPos,
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
  };

  const startSelect = (e: MouseEvent) => {
    if (e.target === btnPlay || e.target === btnStop) {
      return;
    }
    selectionStartPoint.x = e.clientX;
    selectionStartPoint.y = e.clientY;
    selectionDiv.style.display = 'block';
    document.addEventListener('mouseup', stopSelect);
    document.addEventListener('mousemove', drawSelect);
  };

  // song.setTempo(200);
  document.addEventListener('mousedown', startSelect);
  window.addEventListener('scroll', e => {
    scrollPos = window.scrollY;
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
};

init();
