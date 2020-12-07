/**
 * Used to calculate the position of the song when the user
 * clicks somewhere in the score
 */

export const songPositionFromScore = (
  repeats: number[][],
  bar: number
): { bar: number; hasRepeated: { [index: number]: boolean } } => {
  if (repeats.length <= 1) {
    return { bar, hasRepeated: {} };
  }
  const hasRepeated: { [index: number]: boolean } = {};
  let newBar = bar;
  let loop = true;
  let i = 0;
  while (loop && i < repeats.length) {
    const endBar = repeats[i][1];
    if (endBar > bar) {
      loop = false;
    } else {
      newBar += repeats[i][1] - repeats[i][0] + 1;
      hasRepeated[i] = true;
      i++;
    }
  }
  // console.log(newBar, hasRepeated);
  return { bar: newBar, hasRepeated };
};

// export const songPositionFromScore = (repeats: number[][], bar: number): number => {
//   if (repeats.length <= 1) {
//     return bar;
//   }
//   let newBar = bar;
//   let loop = true;
//   let i = 0;
//   while (loop && i < repeats.length) {
//     const endBar = repeats[i][1];
//     if (endBar > bar) {
//       loop = false;
//     } else {
//       newBar += repeats[i][1] - repeats[i][0] + 1;
//       i++;
//     }
//   }
//   // console.log(newBar);
//   return newBar;
// };
