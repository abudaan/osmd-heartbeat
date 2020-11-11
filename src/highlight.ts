import { MIDINote } from 'heartbeat-sequencer';
import { setGraphicalNoteColor, MusicSystemShim, NoteMappingMIDIToGraphical } from 'webdaw-modules';

let raqId: number;
let currentY = 0;
let reference = -1;
let scrollPos = 0;

// highlight active notes and dim passive notes
const highlight = (snapshot: Heartbeat.SnapShot, midiToGraphical: NoteMappingMIDIToGraphical) => {
  // console.log(snapshot);
  snapshot.notes.stateChanged.forEach(function(note: MIDINote) {
    const noteId = note.id;
    if (note.active) {
      console.log(noteId);
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
    } else if (note.active === false) {
      if (midiToGraphical[noteId]) {
        const { element } = midiToGraphical[noteId];
        setGraphicalNoteColor(element, 'black');
      }
    }
  });
};

export const setupHighlight = (
  keyEditor: Heartbeat.KeyEditor,
  midiToGraphical: NoteMappingMIDIToGraphical
) => {
  console.log(midiToGraphical);
  const render = () => {
    const snapshot = keyEditor.getSnapshot('key-editor');
    highlight(snapshot, midiToGraphical);
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
