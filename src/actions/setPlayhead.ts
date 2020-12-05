import { calculateSongPositionByScorePosition } from '../calculateSongPositionByScorePosition';
import { getBarInfo } from '../getBarInfo';
import { getBoundingBoxMeasureAll } from '../getBoundingBoxMeasure';
import { getMeasureAtPoint } from '../getMeasureAtPoint';
import { getSong } from '../songWrapper';
import { store } from '../store';
import { getOSMD } from '../scoreWrapper';
import { draw } from '../playhead';

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

    const currentBarSong = calculateSongPositionByScorePosition(
      store.getState().repeats,
      measureNumber
    );

    const song = getSong();
    const { durationMillis, startMillis } = getBarInfo(song, currentBarSong);
    const pixelsPerMillisecond = width / durationMillis;
    const songPositionMillis = startMillis + offset / pixelsPerMillisecond;
    song.setPlayhead('millis', songPositionMillis);

    draw({ x: x + offset, y, width, height });

    store.setState({
      pixelsPerMillisecond,
      // currentBarScore: measureNumber,
    });
  }
};
