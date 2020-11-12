import { MIDINote } from 'heartbeat-sequencer';
import { MusicSystemShim, NoteMappingMIDIToGraphical } from 'webdaw-modules';

let currentY = 0;
let reference = -1;
let scrollPos = 0;

// scroll the score as the playhead goes
export const setScroll = (
  snapshot: Heartbeat.SnapShot,
  midiToGraphical: NoteMappingMIDIToGraphical
) => {
  snapshot.notes.stateChanged.forEach(function(note: MIDINote) {
    const noteId = note.id;
    if (note.active) {
      if (midiToGraphical[noteId]) {
        const { element, musicSystem } = midiToGraphical[noteId];
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
    }
  });
};
