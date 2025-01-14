import React from "react";
import { FileViewer, ViewerProps } from "./FileViewer";
import {
  FileViewerContext,
  ContextProps,
  FileViewerProvider,
} from "../context";

const CombinedCogniteFileViewer = ({
  sdk,
  disableAutoFetch,
  overrideURLMap,
  ...extraProps
}: ContextProps & ViewerProps) => {
  return (
    <FileViewerProvider
      sdk={sdk}
      disableAutoFetch={disableAutoFetch}
      overrideURLMap={overrideURLMap}
    >
      <FileViewer {...(extraProps as ViewerProps)} />
    </FileViewerProvider>
  );
};

const CogniteFileViewer = Object.assign(CombinedCogniteFileViewer, {
  FileViewer,
  Provider: FileViewerProvider,
  Context: FileViewerContext,
});

export { CogniteFileViewer, CombinedCogniteFileViewer };
