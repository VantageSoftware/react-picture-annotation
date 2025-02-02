import React, { useContext } from "react";
import styled from "styled-components";
import { Button } from "@cognite/cogs.js";
import { FileViewerContext } from "../../context";

const Wrapper = styled.div`
  display: inline-flex;
  border-radius: 4px;
  overflow: hidden;
  z-index: 100;

  & > * {
    border-radius: 0px;
  }
`;

type Props = {
  hideControls: boolean;
};

export default function ControlBar(props: Props): JSX.Element {
  const { hideControls } = props;
  const { zoomIn, zoomOut, reset } = useContext(FileViewerContext);

  const onZoomIn = () => zoomIn && zoomIn();
  const onZoomOut = () => zoomOut && zoomOut();
  const onZoomReset = () => reset && reset();

  if (hideControls) return <></>;
  return (
    <Wrapper>
      <Button aria-label="Zoom in" onClick={onZoomIn} icon="ZoomIn" />
      <Button aria-label="Refresh" icon="Refresh" onClick={onZoomReset} />
      <Button aria-label="Zoom out" icon="ZoomOut" onClick={onZoomOut} />
    </Wrapper>
  );
}
