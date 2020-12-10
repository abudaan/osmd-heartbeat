/**
 * Used to calculate the position of the playhead in the score
 * based on the position of the playhead in the song.
 *
 * Called by the action updateBar.ts
 */

export const scorePositionFromSong = (
  repeats: number[][],
  hasRepeated: { [index: number]: boolean },
  barSong: number
): {
  bar: number;
  hasRepeated: { [index: number]: boolean };
} => {
  if (!repeats.length) {
    return { bar: barSong, hasRepeated };
  }
  const hasRepeatedClone = { ...hasRepeated };

  for (let i = 0; i < repeats.length; i++) {
    const repeat = repeats[i];
    if (barSong > repeat[1]) {
      if (hasRepeatedClone[i] !== true) {
        hasRepeatedClone[i] = true;
      }
    }
  }

  let newBar = barSong;
  for (let i = 0; i < repeats.length; i++) {
    const repeat = repeats[i];
    if (hasRepeatedClone[i] === true) {
      newBar -= repeat[1] - repeat[0] + 1;
    }
  }

  return { bar: newBar, hasRepeated: hasRepeatedClone };
};
