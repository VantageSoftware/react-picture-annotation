import { useState } from "react";
import simplify from "simplify-js";
import { IStageState } from "../../ReactPictureAnnotation";

type OriginalFileSize = { width: number; height: number };

export const useScaledDrawing = (
  scaleState: IStageState,
  originalFileSize: OriginalFileSize
) => {
  const [tolerance] = useState(5);
  const [highQuality] = useState(true);

  /**
   * Returns drawing scaled to current scale.
   */
  const getScaledDrawData = (drawingToScale: string): string | undefined => {
    const { scale, originX, originY } = scaleState;
    const { width: originalWidth, height: originalHeight } = originalFileSize;

    if (!originalWidth || !originalHeight) return;

    const drawDataParsed = JSON.parse(drawingToScale);
    const drawDataMapped = {
      ...drawDataParsed,
      lines: drawDataParsed.lines.map((line: any) => {
        return {
          ...line,
          points: line.points.map((point: any) => ({
            x: scale * originalWidth * point.x + originX,
            y: scale * originalHeight * point.y + originY,
          })),
          brushRadius: Math.round(line.brushRadius * scale),
        };
      }),
    };
    const scaled = JSON.stringify(drawDataMapped);
    return scaled;
  };

  /**
   * Returns drawing in its raw state - aka converted to scale 1,
   * and then to percentage of the original file.
   */
  const getRawDrawData = (drawingToDescale: string): string | undefined => {
    const { scale, originX, originY } = scaleState;
    const { width: originalWidth, height: originalHeight } = originalFileSize;

    if (!originalWidth || !originalHeight) return;

    const drawDataParsed = JSON.parse(drawingToDescale);
    const drawDataMapped = {
      ...drawDataParsed,
      lines: drawDataParsed.lines.map((line: any) => {
        return {
          ...line,
          points: simplify(line.points, tolerance, highQuality).map(
            (point: any) => ({
              x: (point.x - originX) / scale / originalWidth,
              y: (point.y - originY) / scale / originalHeight,
            })
          ),
          brushRadius: Math.round(line.brushRadius / scale),
        };
      }),
    };
    const raw = JSON.stringify(drawDataMapped);
    return raw;
  };

  return {
    getScaledDrawData,
    getRawDrawData,
  };
};
