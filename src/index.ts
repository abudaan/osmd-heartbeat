import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import sequencer, {
  loadMusicXMLFile,
  MIDIEvent,
  MIDINote,
  Song,
  KeyEditor,
} from 'heartbeat-sequencer';
// import { getGraphicalNotesPerMeasurePerTrack } from '../../WebDAW/src/osmd/getGraphicalNotesPerMeasurePerTrack';
// import { mapMIDINoteIdToGraphicalNotePerTrack } from '../../WebDAW/src/osmd/mapMIDINoteIdToGraphicalNotePerTrack';
import {
  parseMusicXML,
  setGraphicalNoteColor,
  getGraphicalNotesPerMeasure,
  mapMIDINoteIdToGraphicalNote,
  getGraphicalNotesPerMeasurePerTrack,
  mapMIDINoteIdToGraphicalNotePerTrack,
  MusicSystemShim,
  getVersion,
  NoteMappingMIDIToGraphical,
  getSelectedMeasures,
  NoteMappingGraphicalToMIDI,
  GraphicalNoteData,
  BoundingBoxMeasure,
  getBoundingBoxesOfSelectedMeasures,
} from 'webdaw-modules';
import { setScroll } from './setScroll';
import { setHighlight } from './setHighlight';
import { setupSequencer } from './setupSequencer';
import { setupSong } from './setupSong';
import { setupScore } from './setupScore';

const ppq = 960;

const midiFileName = 'mozk545a_2-bars';
const midiFile = '../assets/mozk545a_2-bars.mid';
const mxmlFile = '../assets/mozk545a_2-bars.musicxml';

const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `../assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `../assets/${instrumentName}.mp3.json`;
let midiToGraphical: NoteMappingMIDIToGraphical = {};
let graphicalToMidi: NoteMappingGraphicalToMIDI = {};
let graphicalNotesPerBar: GraphicalNoteData[][];
let graphicalNotesPerBarPerTrack: GraphicalNoteData[][][];
let scoreDivOffsetX: number = 0;
let scoreDivOffsetY: number = 0;
let selectedMeasures: number[] = [];
// for setting the scroll position of the page based on the song position
let scrollPos = 0;
let currentY = 0;
let reference = -1;
// requestAnimationFrame id for highlighting the active notes

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

const resize = async (song: Heartbeat.Song) => {
  osmd.render();
  scoreDivOffsetX = scoreDiv.offsetLeft;
  scoreDivOffsetY = scoreDiv.offsetTop;

  const textElements = document.getElementsByTagName('text');
  for (let i = 0; i < textElements.length; i++) {
    const el = textElements[i];
    if (el.innerHTML === 'f') {
      el.setAttribute('font-weight', 'normal');
      el.setAttribute('font-style', 'normal');
    }
  }

  graphicalNotesPerBarPerTrack = getGraphicalNotesPerMeasurePerTrack(osmd, ppq);
  console.log(graphicalNotesPerBarPerTrack);
  const mappings: {
    // score: number;
    midiToGraphical: NoteMappingMIDIToGraphical;
    graphicalToMidi: NoteMappingGraphicalToMIDI;
  }[] = mapMIDINoteIdToGraphicalNotePerTrack(graphicalNotesPerBarPerTrack, repeats, song.notes);
  // console.log(mappings);

  mappings.forEach(mapping => {
    midiToGraphical = {
      ...midiToGraphical,
      ...mapping.midiToGraphical,
    };
    graphicalToMidi = {
      ...graphicalToMidi,
      ...mapping.graphicalToMidi,
    };
  });

  /*
  // the score has been rendered so we can get all references to the SVGElement of the notes
  graphicalNotesPerBar = await getGraphicalNotesPerMeasure(osmd, ppq);
  // map the MIDI notes (MIDINote) to the graphical notes (SVGElement)
  ({ midiToGraphical, graphicalToMidi } = mapMIDINoteIdToGraphicalNote(
    graphicalNotesPerBar,
    repeats,
    song.notes
  ));
*/
  // setup listeners for every graphical note to make them clickable
  Object.values(midiToGraphical).forEach(({ element }) => {
    element.addEventListener('mousedown', e => {
      const midiNote = graphicalToMidi[element.id];
      const noteOn = midiNote.noteOn as MIDIEvent;
      const noteOff = midiNote.noteOff as MIDIEvent;
      if (e.ctrlKey) {
        song.setPlayhead('ticks', noteOn.ticks);
        if (!song.playing) {
          song.play();
        }
        resetScore();
        setGraphicalNoteColor(element, 'red');
      } else {
        setGraphicalNoteColor(element, 'red');
        sequencer.processEvent(
          [
            sequencer.createMidiEvent(0, 144, noteOn.noteNumber, noteOn.velocity),
            sequencer.createMidiEvent(noteOff.ticks - noteOn.ticks, 128, noteOff.noteNumber, 0),
          ],
          instrumentName
        );
      }
      e.stopImmediatePropagation();
    });
    element.addEventListener('mouseup', e => {
      sequencer.stopProcessEvents();
      setGraphicalNoteColor(element, 'black');
    });
  });
  // redraw loop selection
  const boundingBoxes = getBoundingBoxesOfSelectedMeasures(selectedMeasures, osmd);
  drawLoop(boundingBoxes);
};

const setupWatcher = (
  keyEditor: Heartbeat.KeyEditor,
  midiToGraphical: NoteMappingMIDIToGraphical
) => {
  let raqId: number;
  const render = () => {
    const snapshot = keyEditor.getSnapshot('key-editor');
    setHighlight(snapshot, midiToGraphical);
    setScroll(snapshot, midiToGraphical);
  };
  const loop = () => {
    render();
    raqId = requestAnimationFrame(loop);
  };
  return {
    start: () => {
      raqId = requestAnimationFrame(loop);
    },
    stop: () => {
      cancelAnimationFrame(raqId);
    },
    runOnce: render,
  };
};

const init = async () => {
  await setupSequencer();
  const { song, keyEditor } = await setupSong();
  const { repeats, initialTempo } = await setupScore();
  // the score gets rendered every time the window resizes; here we force the first render
  await resize(song);

  const { start: startWatch, stop: stopWatch } = setupWatcher(keyEditor, midiToGraphical);

  // setup controls
  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
    stopWatch();
    resetScore();
  });
  song.addEventListener('pause', () => {
    btnPlay.innerHTML = 'play';
    stopWatch();
  });
  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
    startWatch();
  });
  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
    stopWatch();
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
    stopWatch();
    resetScore();
  });

  // everything has been setup so we can enable the buttons
  btnPlay.disabled = false;
  btnStop.disabled = false;
  loadingDiv.style.display = 'none';

  window.addEventListener('resize', async () => {
    await resize(song);
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
      resetScore();
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
