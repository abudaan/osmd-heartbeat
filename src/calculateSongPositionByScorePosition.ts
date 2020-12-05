export const calculateSongPositionByScorePosition = (repeats: number[][], bar: number): number => {
  if (repeats.length <= 1) {
    return bar;
  }
  let newBar = bar;
  let loop = true;
  let i = 0;
  while (loop && i < repeats.length) {
    const endBar = repeats[i][1];
    if (endBar > bar) {
      loop = false;
    } else {
      newBar += repeats[i][1] - repeats[i][0] + 1;
      i++;
    }
  }
  // console.log(newBar);
  return newBar;
};
