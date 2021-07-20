import { useCallback } from "react";
import simplify from "simplify-js";
import { IDrawingLine } from "types";
import { IStageState } from "../../ReactPictureAnnotation";

type LineMapCallback = (line: IDrawingLine, scale: number) => IDrawingLine;
type OriginalFileSize = { width: number; height: number };

export const useScaledDrawing = (
  scaleState: IStageState,
  originalFileSize: OriginalFileSize
) => {
  /**
   * Process the drawing and adjust the lines scaling
   */
  const adjustDrawingScale = useCallback(
    (
      drawingToScale: string,
      scale: number,
      lineMapCallback: LineMapCallback
    ) => {
      const drawDataParsed = JSON.parse(drawingToScale);
      const drawDataMapped = {
        ...drawDataParsed,
        lines: drawDataParsed.lines.map((line: IDrawingLine) =>
          lineMapCallback(line, scale)
        ),
        width: "100%",
        height: "100%",
      };

      const scaled = JSON.stringify(drawDataMapped);
      return scaled;
    },
    []
  );

  /**
   * Returns drawing scaled to current scale.
   */
  const getScaledDrawData = useCallback(
    (drawingToScale: string): string | undefined => {
      const { scale } = scaleState;
      const { width: originalWidth, height: originalHeight } = originalFileSize;

      if (!originalWidth || !originalHeight) return;

      const scaledDrawDataCallback = (
        line: IDrawingLine,
        scaleToUse: number
      ) => {
        return {
          ...line,
          points: line.points.map((point: any) => ({
            x: point.x * scaleToUse * originalWidth,
            y: point.y * scaleToUse * originalHeight,
          })),
          brushRadius: Math.round(line.brushRadius * scaleToUse),
        };
      };

      return adjustDrawingScale(drawingToScale, scale, scaledDrawDataCallback);
    },
    [scaleState.scale]
  );

  /**
   * Returns drawing in its raw state - aka converted to scale 1,
   * or to percentage of canvas.
   */
  const getRawDrawData = useCallback(
    (drawingToDescale: string): string | undefined => {
      const { scale } = scaleState;
      const { width: originalWidth, height: originalHeight } = originalFileSize;
      const highQuality = true;
      const tolerance = 5;

      if (!originalWidth || !originalHeight) return;

      const descaledDrawDataCallback = (
        line: IDrawingLine,
        scaleToUse: number
      ) => {
        return {
          ...line,
          points: simplify(line.points, tolerance, highQuality).map(
            (point: any) => ({
              x: point.x / scaleToUse / originalWidth,
              y: point.y / scaleToUse / originalHeight,
            })
          ),
          brushRadius: Math.round(line.brushRadius / scaleToUse),
        };
      };

      return adjustDrawingScale(
        drawingToDescale,
        scale,
        descaledDrawDataCallback
      );
    },
    [scaleState.scale]
  );

  return {
    getScaledDrawData,
    getRawDrawData,
  };
};
