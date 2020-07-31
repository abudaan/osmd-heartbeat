import sequencer, { loadMusicXMLFile } from 'heartbeat-sequencer';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  parseMusicXML,
  setGraphicalNoteColor,
  getGraphicalNotesPerBar,
  mapMIDINoteIdToGraphicalNote,
} from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';

const c = document.getElementById('score');
if (c === null) {
  throw new Error('element not found');
}
const divLoading = document.getElementById('loading') as HTMLDivElement;
const osmd = new OpenSheetMusicDisplay(c, {
  backend: 'svg',
  autoResize: true,
});

const ppq = 960;
const midiFile = 'mozk545a_musescore';
const init = async () => {
  await sequencer.ready();
  await loadMIDIFile(`./assets/${midiFile}.mid`);
  const song = sequencer.createSong(sequencer.getMidiFile(midiFile));

  const srcName = 'TP00-PianoStereo';
  let url = `assets/${srcName}.mp3.json`;
  if (sequencer.browser === 'firefox') {
    url = `assets/${srcName}.ogg.json`;
  }
  const json = await loadJSON(url);
  await addAssetPack(json);
  song.tracks.forEach(track => {
    track.setInstrument(srcName);
  });

  const xmlDoc = await loadMusicXMLFile('./assets/mozk545a_musescore.musicxml');
  divLoading.innerHTML = 'loading musicxml';
  await osmd.load(xmlDoc);
  osmd.render();

  // const notes = c.getElementsByClassName('vf-stavenote');
  // console.log(notes);
  console.log(osmd);
  divLoading.innerHTML = 'parsing musicxml';
  const graphicalNotesPerBar = await getGraphicalNotesPerBar(osmd, ppq);

  console.log(graphicalNotesPerBar);
  // console.log(song);
  // console.log(graphicalNotesPerBar[0][0] instanceof Vex.Flow.StaveNote);
  divLoading.innerHTML = 'connecting heartbeat';
  console.time('connect_heartbeat');
  const events = song.events.filter(event => event.command === 144);
  // console.log(events);
  const numNotes = events.length;
  const numBars = graphicalNotesPerBar.length;
  const parsed = parseMusicXML(xmlDoc, ppq);
  if (parsed === null) {
    return;
  }
  const { repeats, initialTempo } = parsed;
  const mapping = mapMIDINoteIdToGraphicalNote(graphicalNotesPerBar, repeats, song.notes);
  console.log(mapping);

  console.timeEnd('connect_heartbeat');
  // console.log(song.events);
  divLoading.style.display = 'none';
  const btnPlay = document.getElementById('play') as HTMLButtonElement;
  const btnStop = document.getElementById('stop') as HTMLButtonElement;
  btnPlay.disabled = true;
  btnStop.disabled = true;

  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;
  const height = window.innerHeight;
  song.addEventListener('event', 'type = NOTE_ON', event => {
    const noteId = event.midiNote.id;
    // console.log(event.midiNote.noteOn);
    // console.log(noteId, mapping[noteId]);
    if (mapping[noteId]) {
      const { element, musicSystem } = mapping[noteId];
      setGraphicalNoteColor(element, 'red');

      const tmp = musicSystem.graphicalMeasures[0][0].stave.y;
      if (currentY !== tmp) {
        currentY = tmp;
        const bbox = element.getBoundingClientRect();
        // console.log(bbox.y, window.pageYOffset);
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

  song.addEventListener('event', 'type = NOTE_OFF', event => {
    const noteId = event.midiNote.id;
    if (mapping[noteId]) {
      const { element } = mapping[noteId];
      setGraphicalNoteColor(element, 'black');
    }
  });

  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
  });
  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
  });
  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
  });

  btnPlay.disabled = false;
  btnStop.disabled = false;

  btnPlay.addEventListener('click', () => {
    if (song.playing) {
      // btnPlay.innerHTML = 'play';
      song.pause();
    } else {
      // btnPlay.innerHTML = 'pause';
      song.play();
    }
  });
  btnStop.addEventListener('click', () => {
    song.stop();
  });
};

init();
