export const calculateSongPositionByScorePosition = (repeats: number[][], bar: number): number => {
  if (repeats.length <= 1) {
    return bar;
  }
  let newBar = bar;
  for (let i = 1; i < repeats.length; i++) {
    if (bar >= repeats[i][0]) {
      newBar = bar + repeats[i][0] - 1;
    }
  }
  console.log(newBar);
  return newBar;
};
