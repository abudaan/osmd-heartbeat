import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const getBoundingBoxMeasure = (
  osmd: OpenSheetMusicDisplay,
  measureNumber: number
): BoundingBox => {
  const measures = osmd.GraphicSheet.MeasureList.find(e => e[0]['measureNumber'] === measureNumber);
  let x: number = 0;
  let y: number = 0;
  let width: number = 0;
  let height: number = 0;
  if (measures) {
    const yPos: number[] = [];
    measures.forEach((m, i) => {
      const stave = m.stave;
      // console.log(i, stave);
      ({ x, y, width, height } = stave);
      yPos.push(y);
    });

    const yMin = Math.min(...yPos);
    const yMax = Math.max(...yPos);
    // console.log(yMax, yMin, height, yMax - yMin + height);
    return {
      x: x,
      y: yMin,
      width,
      height: yMax - yMin + height,
    };
  }
  // return null;
  return { x, y, width, height };
};
