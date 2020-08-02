import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import sequencer, { loadMusicXMLFile, MIDIEvent, Song } from 'heartbeat-sequencer';
import {
  parseMusicXML,
  setGraphicalNoteColor,
  getGraphicalNotesPerBar,
  mapMIDINoteIdToGraphicalNote,
  MusicSystemShim,
  getVersion,
  NoteMappingMIDIToGraphical,
  getGraphicalNotesInSelection,
  NoteMappingGraphicalToMIDI,
  GraphicalNoteData,
} from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';

const ppq = 960;
// const midiFile = '../assets/mozk545a_musescore.mid';
// const mxmlFile = '../assets/mozk545a_musescore.musicxml';
const midiFileName = 'spring';
const midiFile = '../assets/spring.mid';
const mxmlFile = '../assets/spring.xml';
const instrumentName = 'TP00-PianoStereo';
const instrumentOgg = `../assets/${instrumentName}.ogg.json`;
const instrumentMp3 = `../assets/${instrumentName}.mp3.json`;
let midiToGraphical: NoteMappingMIDIToGraphical;
let graphicalToMidi: NoteMappingGraphicalToMIDI;
let graphicalNotesPerBar: GraphicalNoteData[][];
let song: Song;
let repeats: number[][];
let initialTempo: number;

const btnPlay = document.getElementById('play') as HTMLButtonElement;
const btnStop = document.getElementById('stop') as HTMLButtonElement;
const scoreDiv = document.getElementById('score');
const selectionDiv = document.getElementById('selection');
if (scoreDiv === null || selectionDiv === null) {
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

const resize = async () => {
  osmd.render();
  // the score has been rendered so we can get all references to the SVGElement of the notes
  graphicalNotesPerBar = await getGraphicalNotesPerBar(osmd, ppq);
  // map the MIDI notes (MIDINote) to the graphical notes (SVGElement)
  ({ midiToGraphical, graphicalToMidi } = mapMIDINoteIdToGraphicalNote(
    graphicalNotesPerBar,
    repeats,
    song.notes
  ));
  // setup listener for highlighting the active notes and for the scroll position
  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;
  song.addEventListener('event', 'type = NOTE_ON', (event: MIDIEvent) => {
    const noteId = event.midiNote.id;
    if (midiToGraphical[noteId]) {
      const { element, musicSystem } = midiToGraphical[noteId];
      setGraphicalNoteColor(element, 'red');
      const tmp = ((musicSystem as unknown) as MusicSystemShim).graphicalMeasures[0][0].stave.y;
      if (currentY !== tmp) {
        currentY = tmp;
        const bbox = element.getBoundingClientRect();
        if (reference === -1) {
          reference = bbox.y;
        } else {
          scrollPos = bbox.y + window.pageYOffset - reference;
          window.scroll({
            top: scrollPos,
            behavior: 'smooth',
          });
        }
      }
    }
  });
  // setup listener to switch of the highlighting if notes are not active anymore
  song.addEventListener('event', 'type = NOTE_OFF', (event: MIDIEvent) => {
    const noteId = event.midiNote.id;
    if (midiToGraphical[noteId]) {
      const { element } = midiToGraphical[noteId];
      setGraphicalNoteColor(element, 'black');
    }
  });
  // setup listeners for every graphical note
  Object.values(midiToGraphical).forEach(({ element }) => {
    element.addEventListener('mousedown', e => {
      const midiNote = graphicalToMidi[element.id];
      const noteOn = midiNote.noteOn as MIDIEvent;
      const noteOff = midiNote.noteOff as MIDIEvent;
      if (e.ctrlKey) {
        song.setPlayhead('ticks', noteOn.ticks);
        resetScore();
        setGraphicalNoteColor(element, 'red');
      } else {
        setGraphicalNoteColor(element, 'red');
        console.log(element);
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
  await resize();
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

  btnPlay.addEventListener('click', () => {
    if (song.playing) {
      song.pause();
    } else {
      song.play();
    }
  });
  btnStop.addEventListener('click', () => {
    song.stop();
    resetScore();
  });
  // everything has been setup so we can enable the buttons
  btnPlay.disabled = false;
  btnStop.disabled = false;

  window.addEventListener('resize', async () => {
    await resize();
  });

  const selectionStartPoint: { x: number; y: number } = { x: -1, y: -1 };
  const selectionEndPoint: { x: number; y: number } = { x: -1, y: -1 };
  const drawSelect = (e: MouseEvent) => {
    selectionDiv.style.left = `${selectionStartPoint.x}px`;
    selectionDiv.style.top = `${selectionStartPoint.y}px`;
    selectionDiv.style.width = `${e.clientX - selectionStartPoint.x}px`;
    selectionDiv.style.height = `${e.clientY - selectionStartPoint.y}px`;
    selectionEndPoint.x = e.clientX;
    selectionEndPoint.y = e.clientY;
  };

  const stopSelect = (e: MouseEvent) => {
    document.removeEventListener('mouseup', stopSelect);
    document.removeEventListener('mousemove', drawSelect);
    selectionDiv.style.display = 'none';
    selectionDiv.style.left = '0px';
    selectionDiv.style.top = '0px';
    selectionDiv.style.width = '0px';
    selectionDiv.style.height = '0px';
    getGraphicalNotesInSelection(graphicalNotesPerBar, selectionStartPoint, selectionEndPoint);
  };

  const startSelect = (e: MouseEvent) => {
    selectionStartPoint.x = e.clientX;
    selectionStartPoint.y = e.clientY;
    selectionDiv.style.display = 'block';
    document.addEventListener('mouseup', stopSelect);
    document.addEventListener('mousemove', drawSelect);
  };

  document.addEventListener('mousedown', startSelect);
};

init();
