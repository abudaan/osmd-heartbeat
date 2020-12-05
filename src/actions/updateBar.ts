import { getBarInfo } from '../utils/getBarInfo';
import { getSong } from '../songWrapper';
import { store } from '../store';
import { scorePositionFromSong } from '../utils/scorePositionFromSong';

/**
 * The song playhead enters a new bar
 */
export const updateBar = () => {
  const song = getSong();
  const {
    repeats,
    hasRepeated,
    boundingBoxesMeasures,
    playhead,
    offset: { y: offsetY, x: offsetX },
  } = store.getState();
  const bar = scorePositionFromSong(repeats, hasRepeated, song.bar);
  console.log(song.bar, bar);
  const { x, y, width, height } = boundingBoxesMeasures[bar - 1];
  const { durationMillis, startMillis } = getBarInfo(song, song.bar);
  const pixelsPerMillisecond = width / durationMillis;
  store.setState({
    pixelsPerMillisecond,
    playhead: {
      ...playhead,
      x: offsetX,
      y: y + offsetY,
      height,
    },
    currentBarStartX: x,
    currentBarStartMillis: startMillis,
  });
};
