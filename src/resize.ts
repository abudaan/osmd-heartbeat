export const resize = async ({ osmd, scoreDiv }) => {
  osmd.render();
  const scoreDivOffsetX = scoreDiv.offsetLeft;
  const scoreDivOffsetY = scoreDiv.offsetTop;
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

  const boundingBoxes = getSelectedMeasureBoundingBoxes(selectedBarNumbers, graphicalNotesPerBar);
  while (selectedBarsDiv.firstChild) {
    selectedBarsDiv.removeChild(selectedBarsDiv.firstChild);
  }
  console.log(boundingBoxes);
  // if (boundingBoxes.length > 0) {
  //   selectedBarsDiv.style.display = 'block';
  //   boundingBoxes.forEach(bbox => {
  //     const d = document.createElement('div');
  //     d.className = 'bar';
  //     d.style.left = `${bbox.left + scoreDivOffsetX}px`;
  //     d.style.top = `${bbox.top + scoreDivOffsetY}px`;
  //     d.style.height = `${bbox.bottom - bbox.top}px`;
  //     d.style.width = `${bbox.right - bbox.left}px`;
  //     selectedBarsDiv.appendChild(d);
  //   });
  // }
};
