export const scorePositionFromSong = (
  repeats: number[][],
  hasRepeated: { [index: number]: boolean },
  bar: number
) => {
  if (!repeats.length) {
    return bar;
  }

  let newBar = bar;
  repeats.forEach((repeat, i) => {
    if (bar === repeat[1]) {
      if (hasRepeated[i] !== true) {
        newBar = repeat[0] - 1;
        hasRepeated[i] = true;
      }
    }
  });

  return newBar;
};
