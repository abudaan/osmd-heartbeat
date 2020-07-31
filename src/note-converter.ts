import { from, of, forkJoin } from 'rxjs';
import { map, filter, tap, switchMap, mergeMap, reduce, groupBy, toArray } from 'rxjs/operators';
import { curry } from 'ramda';


import Vex from 'vexflow';
const {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
} = Vex.Flow;


const roundToStep = (number: number, increment: number, offset: number): number => {
  return Math.ceil((number - offset) / increment) * increment + offset;
}

const getDuration = (roundedTicks: number): [string, boolean] => {
  // console.log(roundedTicks);
  switch (roundedTicks) {
    case 0.25:
      return ['16', false];
    case 0.5:
      return ['8', false];
    case 0.75:
      return ['8', true];
    case 1:
      return ['q', false];
    case 1.5:
      return ['q', true];
    default:
      return ['q', false];
  }
};

const round = (float: number): number => {
  const r = Math.round(float * 100) / 100;
  return r;
}

const convertNote = (ppq: number, note: Heartbeat.MIDINote): [Heartbeat.MIDINote, Vex.Flow.StaveNote] => {
  console.log(note.durationTicks, roundToStep(note.durationTicks, 480 / 32, 0));
  const ratio = round(note.durationTicks / ppq);
  const {
    name,
    octave,
  } = note.note;
  const duration = getDuration(ratio);
  // console.log(note.noteOn, name, octave, ratio, duration);
  const sn = new StaveNote({ clef: 'treble', keys: [`${name}/${octave}`], duration: duration[0] });
  if (duration[1]) {
    sn.addDot(0);
  }
  sn.setPlayNote({ noteId: note.id });
  duration.push(`${name.toLowerCase()}/${octave}`)
  return [note, duration];
}

const convertToVexFlow = (song: Heartbeat.Song): Observable => {
  const notes = song.notes;
  const convert = curry<(ppq: number, note: Heartbeat.MIDINote) => [Heartbeat.MIDINote, Vex.Flow.StaveNote]>(convertNote)(song.ppq);
  return from(notes)
    .pipe(
      filter(note => isNaN(note.durationTicks) === false),
      map(convert),
      // tap(console.log),
      groupBy(([midiNote, vexFlowNote]) => midiNote.noteOn.bar),
      mergeMap((group) =>
        group.pipe(
          toArray(),
          mergeMap(data => {
            return from(data)
              .pipe(
                groupBy(([midiNote, vexFlowNote]) => midiNote.noteOn.ticks),
                mergeMap((group) => group.pipe(toArray())),
                // tap(console.log),
              )
          }),
          reduce((acc: [Heartbeat.MIDINote, Vex.Flow.StaveNote][][], val: [Heartbeat.MIDINote, Vex.Flow.StaveNote][]) => {
            acc.push(val);
            return acc;
          }, [])
        )
      ),
      reduce((acc: [Heartbeat.MIDINote, Vex.Flow.StaveNote][][][], val: [Heartbeat.MIDINote, Vex.Flow.StaveNote][][]) => {
        acc.push(val);
        return acc;
      }, [])
    )
}

export {
  convertNote,
  convertToVexFlow,
}