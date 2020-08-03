const selectionStartPoint: { x: number; y: number } = { x: -1, y: -1 };
const selectionEndPoint: { x: number; y: number } = { x: -1, y: -1 };

export const drawSelect = (e: MouseEvent) => {
  selectionDiv.style.left = `${selectionStartPoint.x}px`;
  selectionDiv.style.top = `${selectionStartPoint.y}px`;
  selectionDiv.style.width = `${e.clientX - selectionStartPoint.x}px`;
  selectionDiv.style.height = `${e.clientY - selectionStartPoint.y}px`;
  selectionEndPoint.x = e.clientX;
  selectionEndPoint.y = e.clientY;
};

export const stopSelect = (e: MouseEvent) => {
  // document.removeEventListener('mousedown', startSelect);
  document.removeEventListener('mouseup', stopSelect);
  document.removeEventListener('mousemove', drawSelect);
  selectionDiv.style.display = 'none';
  selectionDiv.style.left = '0px';
  selectionDiv.style.top = '0px';
  selectionDiv.style.width = '0px';
  selectionDiv.style.height = '0px';
  const { barNumbers, boundingBoxes } = getSelectedMeasures(
    graphicalNotesPerBar,
    {
      x: selectionStartPoint.x - scoreDivOffsetX,
      y: selectionStartPoint.y - scoreDivOffsetY,
    },
    {
      x: selectionEndPoint.x - scoreDivOffsetX,
      y: selectionEndPoint.y - scoreDivOffsetY,
    }
  );
  selectedBarNumbers = barNumbers;
  console.log(selectedBarNumbers);
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
};

export const startSelect = (e: MouseEvent) => {
  if (e.target === btnPlay || e.target === btnStop) {
    return;
  }
  selectionStartPoint.x = e.clientX;
  selectionStartPoint.y = e.clientY;
  selectionDiv.style.display = 'block';
  document.addEventListener('mouseup', stopSelect);
  document.addEventListener('mousemove', drawSelect);
};
