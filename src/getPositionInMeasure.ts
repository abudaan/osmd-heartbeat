import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  BoundingBoxMeasure,
  getBoundingBoxesOfGraphicalMeasures,
  hasOverlap,
} from 'webdaw-modules';

export const getPositionInMeasure = (
  e: MouseEvent,
  osmd: OpenSheetMusicDisplay
): BoundingBoxMeasure | null => {
  const offsetX = osmd['container'].offsetLeft;
  const offsetY = osmd['container'].offsetTop;
  const scrollPosX = window.scrollX;
  const scrollPosY = window.scrollY;
  // const x = e.clientX + offsetX + scrollPosX;
  // const y = e.clientY + offsetY + scrollPosY;
  const x = e.clientX - offsetX + scrollPosX;
  const y = e.clientY - offsetY + scrollPosY;
  // console.log(offsetY, scrollPosY, x, y);
  const boxes = getBoundingBoxesOfGraphicalMeasures(osmd);

  for (let i = 0; i < boxes.length; i++) {
    const staves = boxes[i];
    const yPos = [];
    const xPos = [];
    let box;
    let height = 0;
    for (let j = 0; j < staves.length; j++) {
      box = staves[j];
      xPos.push(box.left, box.right);
      yPos.push(box.top, box.bottom);
      height = box.height;
      // console.log('top', box.top);
    }
    if (box) {
      const xMin = Math.min(...xPos); //+ offsetX;
      const xMax = Math.max(...xPos); //+ offsetX;
      const yMin = Math.min(...yPos); //+ offsetY;
      const yMax = Math.max(...yPos); //+ offsetY;
      // console.log('yMin', yMin);
      const ref1 = {
        x: xMin,
        left: xMin,
        right: xMax,
        y: yMin,
        top: yMin,
        bottom: yMax + height,
        width: xMax - xMin,
        height: yMax - yMin,
        measureNumber: box.measureNumber,
      };
      const ref2 = {
        top: y,
        bottom: y + 2,
        left: x,
        right: x + 2,
        x,
        y,
        width: 2,
        height: 2,
      };
      const hit = hasOverlap(ref1, ref2);
      // console.log(ref1, ref2);
      if (hit) {
        // ref1.x -= offsetX;
        // ref1.y -= offsetY;
        // ref1.width -= offsetY;
        // ref1.top -= offsetY;
        return ref1;
      }
    }
  }
  return null;
};
