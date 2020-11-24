import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// generic util method, will become part of WebDAW

export const getBoundingBoxMeasureAllStaves = (
  osmd: OpenSheetMusicDisplay,
  measureNumber: number
): BoundingBox => {
  const staves = osmd.GraphicSheet.MeasureList.find(e => e[0]['measureNumber'] === measureNumber);
  let x: number = 0;
  let y: number = 0;
  let width: number = 0;
  let height: number = 0;
  if (staves) {
    const yPos: number[] = [];
    staves.forEach((s, i) => {
      const stave = (s as any).stave;
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
