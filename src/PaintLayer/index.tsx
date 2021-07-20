import React, { useContext, useState, useEffect } from "react";
import CanvasDraw from "react-canvas-draw";
import styled from "styled-components";
import { FileViewerContext, useScaledDrawing } from "../context";
import { IStageState } from "../ReactPictureAnnotation";
import { Wrapper } from "./components";
import { toRGB } from "../utils/RGB";

const StyledCanvasDraw = styled(CanvasDraw).attrs(
  ({ paintLayerEditMode }: { paintLayerEditMode: boolean }) => {
    const style: any = {};
    if (!paintLayerEditMode) style.pointerEvents = "none";
    return { style };
  }
)<{ paintLayerEditMode: boolean }>`
  background: transparent;
  position: absolute;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
`;

type Props = {
  scaleState: IStageState;
  hidePaintLayer: boolean;
  forceFinishDrawing: boolean;
  setForceFinishDrawing: (value: boolean) => void;
};

export default function PaintLayer(props: Props): JSX.Element {
  const {
    scaleState,
    hidePaintLayer,
    forceFinishDrawing,
    setForceFinishDrawing,
  } = props;
  const {
    file,
    paintLayerCanvasRef,
    paintLayerEditMode,
    brushColor,
    brushRadius,
    drawData,
    snapStraightEnabled,
    shouldSaveDrawData,
    setDrawData,
    setShouldSaveDrawData,
  } = useContext(FileViewerContext);
  const { getScaledDrawData, getRawDrawData } = useScaledDrawing(scaleState);
  const [loadTimeOffset] = useState(0);
  const [scaledDrawData, setScaledDrawData] = useState(drawData);
  const [tempDrawData, setTempDrawData] = useState(drawData);

  const getDrawData = (): string | undefined =>
    paintLayerCanvasRef?.current?.getSaveData();

  const saveDrawing = () => {
    if (hidePaintLayer || !shouldSaveDrawData) return;

    const newDrawing = getDrawData();
    if (newDrawing && newDrawing !== drawData) {
      const rawDrawing = getRawDrawData(newDrawing);
      setDrawData(String(rawDrawing));
    }
    setShouldSaveDrawData(false);
  };

  const saveTempDrawing = () => {
    if (hidePaintLayer || paintLayerEditMode) return;
    const newDrawing = getDrawData();
    if (newDrawing && newDrawing !== drawData) {
      const rawDrawing = getRawDrawData(newDrawing);
      setTempDrawData(String(rawDrawing));
    }
  };

  const adjustDrawingToScale = () => {
    const scaledData = getScaledDrawData(tempDrawData);
    setScaledDrawData(scaledData);
  };

  const snapLineStraight = () => {
    if (!snapStraightEnabled) return;
    const drawing = getDrawData();
    if (!drawing) return;
    const saveData = JSON.parse(drawing);
    const lineToFix = saveData.lines.pop();
    lineToFix.points.splice(1, lineToFix.points.length - 2);
    saveData.lines.push(lineToFix);
    const fixedSaveData = JSON.stringify(saveData);
    const rawDrawing = getRawDrawData(fixedSaveData);
    setTempDrawData(String(rawDrawing));
  };

  useEffect(() => {
    adjustDrawingToScale();
  }, [scaleState.scale, tempDrawData]);

  useEffect(() => {
    saveDrawing();
  }, [shouldSaveDrawData]);

  useEffect(() => {
    saveTempDrawing();
  }, [paintLayerEditMode]);

  useEffect(() => {
    setTempDrawData(drawData);
  }, [drawData]);

  useEffect(() => {
    if (forceFinishDrawing) {
      snapLineStraight();
      setForceFinishDrawing(false);
    }
  }, [forceFinishDrawing]);

  return (
    <Wrapper onMouseUp={snapLineStraight} data-file-drawings={file?.id}>
      {!hidePaintLayer && (
        <StyledCanvasDraw
          ref={paintLayerCanvasRef}
          saveData={scaledDrawData}
          hideGrid={true}
          brushColor={toRGB(brushColor)}
          brushRadius={brushRadius}
          canvasHeight="100%"
          canvasWidth="100%"
          disabled={!paintLayerEditMode}
          paintLayerEditMode={paintLayerEditMode}
          loadTimeOffset={loadTimeOffset}
          style={{
            background: "transparent",
            width: "auto",
            height: "auto",
            // leave it like this, css is handling the moving of the pnid
            // prevents unwanted repaint
            left: scaleState.originX,
            top: scaleState.originY,
          }}
        />
      )}
    </Wrapper>
  );
}

export * from "./helpers";
