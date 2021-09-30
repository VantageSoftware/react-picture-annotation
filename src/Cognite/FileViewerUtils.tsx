import {
  PendingCogniteAnnotation,
  CogniteAnnotation,
} from "@cognite/annotations";
import { Colors } from "@cognite/cogs.js";
import { IAnnotation, IRectShapeData } from "..";
import { CogniteClient, FileInfo } from "@cognite/sdk";

export interface ProposedCogniteAnnotation extends PendingCogniteAnnotation {
  id: string;
}

export type CustomizableCogniteAnnotation = (
  | CogniteAnnotation
  | ProposedCogniteAnnotation
) & {
  mark?: {
    backgroundColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    highlight?: boolean;
    draw?: (
      canvas: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number
    ) => void;
  };
};

export type ArrowPreviewOptions = {
  baseOffset?: {
    x?: number;
    y?: number;
  };
  customOffset?: {
    [annotationId: string]: {
      x?: number;
      y?: number;
    };
  };
};

/**
 * If there is no allowCustomAnnotations flag, those are the colors of the annotations.
 */
export const selectAnnotationColors = <T extends PendingCogniteAnnotation>(
  annotation: T,
  isSelected = false,
  isPending = false
): { strokeColor: string; backgroundColor: string } => {
  if (isSelected)
    return {
      strokeColor: Colors["lightblue-1"].hex(),
      backgroundColor: `${Colors.lightblue.hex()}11`,
    };
  if (isPending)
    return {
      strokeColor: Colors["yellow-1"].hex(),
      backgroundColor: `${Colors["yellow-1"].hex()}33`,
    };
  if (annotation.resourceType === "asset")
    return {
      strokeColor: Colors["purple-3"].hex(),
      backgroundColor: `${Colors["purple-3"].hex()}33`,
    };
  if (annotation.resourceType === "file")
    return {
      strokeColor: Colors["midorange-3"].hex(),
      backgroundColor: `${Colors["midorange-3"].hex()}33`,
    };
  if (annotation.resourceType === "timeSeries")
    return {
      strokeColor: Colors["lightblue-3"].hex(),
      backgroundColor: `${Colors["lightblue-3"].hex()}33`,
    };
  if (annotation.resourceType === "sequence")
    return {
      strokeColor: Colors["yellow-3"].hex(),
      backgroundColor: `${Colors["yellow-3"].hex()}33`,
    };
  if (annotation.resourceType === "event")
    return {
      strokeColor: Colors["pink-3"].hex(),
      backgroundColor: `${Colors["pink-3"].hex()}33`,
    };
  return {
    strokeColor: Colors["text-color-secondary"].hex(),
    backgroundColor: `${Colors["text-color-secondary"].hex()}33`,
  };
};

export const convertCogniteAnnotationToIAnnotation = (
  el: CustomizableCogniteAnnotation,
  isSelected = false,
  allowCustomAnnotations: boolean
) => {
  const isPending = typeof el.id === "string";
  const colors = selectAnnotationColors(el, isSelected, isPending);
  const annotation = {
    id: String(el.id),
    comment: el.label ?? "No Label",
    page: el.page,
    status: el.status,
    mark: {
      type: "RECT",
      x: el.box.xMin,
      y: el.box.yMin,
      width: el.box.xMax - el.box.xMin,
      height: el.box.yMax - el.box.yMin,
      strokeWidth: 2,
      strokeColor: colors.strokeColor,
      backgroundColor: colors.backgroundColor,
    },
  } as any;

  if (allowCustomAnnotations) {
    if (el?.mark?.backgroundColor)
      annotation.mark.backgroundColor = el.mark.backgroundColor;
    if (el?.mark?.strokeColor) {
      annotation.mark.strokeColor = el.mark.strokeColor;
    }
    if (el?.mark?.strokeWidth !== undefined) {
      annotation.mark.strokeWidth = el.mark.strokeWidth;
    }
    if (el?.mark?.draw) annotation.mark.draw = el.mark.draw;
    if (el?.mark?.highlight) {
      annotation.mark.highlight = true;
    }
  }
  return annotation as IAnnotation<IRectShapeData>;
};

export const isSameResource = (
  a: CogniteAnnotation | ProposedCogniteAnnotation | PendingCogniteAnnotation,
  b: CogniteAnnotation | ProposedCogniteAnnotation | PendingCogniteAnnotation
) => {
  return (
    a.resourceType === b.resourceType &&
    !!(
      a.resourceExternalId === b.resourceExternalId ||
      (a.resourceId && a.resourceId === b.resourceId)
    )
  );
};

export const isPreviewableImage = (file: FileInfo) => {
  const { mimeType = "" } = file;
  return ["png", "jpeg", "jpg", "svg"].some((el) => mimeType.includes(el));
};

export const retrieveDownloadUrl = async (
  client: CogniteClient,
  fileId: number
) => {
  try {
    const [{ downloadUrl }] = await client.files.getDownloadUrls([
      { id: fileId },
    ]);
    return downloadUrl;
  } catch {
    return undefined;
  }
};
export const retrieveOCRResults = async (
  client: CogniteClient,
  fileId: number
) => {
  try {
    const {
      data: {
        items: [{ annotations }],
      },
    } = await client.post<{ items: { annotations: TextBox[] }[] }>(
      `/api/playground/projects/${client.project}/context/pnid/ocr`,
      { data: { fileId } }
    );
    return annotations || [];
  } catch (e) {
    return [];
  }
};
export interface TextBox {
  text: string;
  boundingBox: { xMin: number; xMax: number; yMin: number; yMax: number };
}
