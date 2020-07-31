import { from, Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import {
  OpenSheetMusicDisplay,
  GraphicalStaffEntry,
  GraphicalNote,
  VexFlowGraphicalNote,
} from 'opensheetmusicdisplay';

type TypeStave = {
  staffEntries: GraphicalStaffEntry[];
};

type TypeNoteData = {
  vfnote: Vex.Flow.Note;
};

// path: openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0];
// path: openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].parentMusicSystem

export const getNoteData = (osmd: OpenSheetMusicDisplay, ppq: number): Promise<TypeNoteData[]> =>
  from(osmd.graphic.measureList)
    .pipe(
      // tap(m => { console.log(m); }),
      map((staves: any, i) => {
        return staves.map((s: TypeStave) => {
          const parentMusicSystem = staves[0].parentMusicSystem;
          return s.staffEntries.map(se => {
            return se.graphicalVoiceEntries.map(ve => {
              // return ve.notes;
              return ve.notes.map((n: GraphicalNote) => {
                const relPosInMeasure = n.sourceNote.voiceEntry.timestamp.realValue;
                const vfnote = (n as VexFlowGraphicalNote).vfnote[0];
                return {
                  vfnote,
                  ticks: i * ppq * 4 + relPosInMeasure * ppq * 4,
                  noteNumber: n.sourceNote.halfTone + 12, // this is weird!
                  bar: i + 1,
                  parentMusicSystem,
                };
              });
            });
          });
        });
      }),
      reduce((acc: any[], val) => {
        acc.push(val.flat(3));
        return acc;
      }, [])
    )
    .toPromise();

// set the color of the active and passive notes
export const colorStaveNote = (el, color: string) => {
  const stems = el.getElementsByClassName('vf-stem');
  const noteheads = el.getElementsByClassName('vf-notehead');
  // console.log(stem, notehead);
  for (let i = 0; i < stems.length; i++) {
    const stem = stems[i];
    stem.firstChild.setAttribute('fill', color);
    stem.firstChild.setAttribute('stroke', color);
  }
  for (let i = 0; i < noteheads.length; i++) {
    const notehead = noteheads[i];
    notehead.firstChild.setAttribute('fill', color);
    notehead.firstChild.setAttribute('stroke', color);
  }
};

// connect graphical notes to MIDI events
export const connect = (barDatas, ticksOffset, events, numNotes) => {
  barDatas.forEach(bd => {
    const { vfnote, ticks, noteNumber, bar, parentMusicSystem } = bd;
    // console.log('check', bar, ticks, noteNumber);
    for (let j = 0; j < numNotes; j++) {
      const event = events[j];
      // console.log(event);
      // if (event.bar == bar && event.noteNumber == noteNumber) {
      if (
        event.command === 144 &&
        event.ticks == ticks + ticksOffset &&
        event.noteNumber == noteNumber
      ) {
        event.vfnote = vfnote;
        event.musicSystem = parentMusicSystem;
        break;
      }
    }
  });
};
