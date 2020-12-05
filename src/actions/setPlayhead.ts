import { songPositionFromScore } from '../utils/songPositionFromScore';
import { getBarInfo } from '../utils/getBarInfo';
import { getBoundingBoxMeasureAll } from '../utils/getBoundingBoxMeasure';
import { getMeasureAtPoint } from '../utils/getMeasureAtPoint';
import { getSong } from '../songWrapper';
import { store } from '../store';
import { getOSMD } from '../scoreWrapper';

/**
 * User clicks somewhere in the score, we translate the position where the user clicked
 * to a position in the song.
 */
export const setPlayhead = (e: PointerEvent) => {
  const osmd = getOSMD();
  const data = getMeasureAtPoint(e, osmd, getBoundingBoxMeasureAll(osmd));

  // console.log(data);
  if (data !== null) {
    const {
      bbox: { x, y, height, width },
      measureNumber,
      offset,
    } = data;

    const currentBarSong = songPositionFromScore(store.getState().repeats, measureNumber);

    const song = getSong();
    const { durationMillis, startMillis } = getBarInfo(song, currentBarSong);
    const pixelsPerMillisecond = width / durationMillis;
    const songPositionMillis = startMillis + offset / pixelsPerMillisecond;

    song.setPlayhead('millis', songPositionMillis);
    // draw({ x: x + offset, y, width, height });

    store.setState({ pixelsPerMillisecond, currentBarScore: measureNumber });
    // store.getState().setPlayheadScore({ x: x + offset, y, width, height });
  }
};
