/**
 * Used to calculate the position of the playhead in the score
 * based on the position of the playhead in the song.
 *
 * Called by the action updateBar.ts
 */

export const scorePositionFromSong = (
  repeats: number[][],
  hasRepeated: { [index: number]: boolean },
  bar: number
): {
  bar: number;
  hasRepeated: { [index: number]: boolean };
} => {
  if (!repeats.length) {
    return { bar, hasRepeated };
  }
  const hasRepeatedClone = { ...hasRepeated };

  let newBar = bar;
  for (let i = 0; i < repeats.length; i++) {
    const repeat = repeats[i];
    if (newBar >= repeat[1] + 1) {
      if (hasRepeatedClone[i] !== true) {
        newBar = repeat[0];
        hasRepeatedClone[i] = true;
      } else {
        newBar -= repeat[1] - repeat[0] + 1;
      }
    }
  }

  return { bar: newBar, hasRepeated: hasRepeatedClone };
};
