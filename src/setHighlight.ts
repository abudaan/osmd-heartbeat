import { MIDINote } from 'heartbeat-sequencer';
import { setGraphicalNoteColor, NoteMappingMIDIToGraphical } from 'webdaw-modules';

// highlight active notes and dim passive notes
export const setHighlight = (
  snapshot: Heartbeat.SnapShot,
  midiToGraphical: NoteMappingMIDIToGraphical
) => {
  // console.log(snapshot);
  snapshot.notes.stateChanged.forEach(function(note: MIDINote) {
    const noteId = note.id;
    if (note.active) {
      if (midiToGraphical[noteId]) {
        const { element } = midiToGraphical[noteId];
        setGraphicalNoteColor(element, 'red');
      }
    } else if (note.active === false) {
      if (midiToGraphical[noteId]) {
        const { element } = midiToGraphical[noteId];
        setGraphicalNoteColor(element, 'black');
      }
    }
  });
};
