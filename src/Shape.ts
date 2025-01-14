import { Colors } from "@cognite/cogs.js";
import { IAnnotation } from "./Annotation";

export const shapeStyle = {
  padding: 8,
  margin: 10,
  fontSize: 14,
  fontColor: Colors.white.hex(),
  fontBackground: Colors["greyscale-grey10"].hex(),
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  shapeBackground: Colors["greyscale-grey10"].hex(),
  shapeStrokeStyle: Colors["greyscale-grey10"].hex(),
  shapeShadowStyle: "hsla(210, 9%, 31%, 0.35)",
};

export interface IShapeBase {
  x: number;
  y: number;
  width: number;
  height: number;
  shadowColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeColor?: string;
  /**
   * Custom draw function, return true if the default boxes should still be drawn. By default it will NOT draw the default boxes if a custom `draw` is passed.
   */
  draw?: (
    canvas2D: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number,
    isDownload: boolean
  ) => boolean | void;
}

export interface IShapeAdjustBase extends Partial<IShapeBase> {}

export interface IShapeData extends IShapeBase {
  type: string;
  highlight?: boolean;
}

export interface IRectShapeData extends IShapeData {
  type: "RECT";
}

export interface IShape {
  onDragStart: (positionX: number, positionY: number) => void;
  onDrag: (positionX: number, positionY: number) => void;
  checkBoundary: (
    positionX: number,
    positionY: number,
    calculateTruePositionNoTransform: (shapeData: IShapeBase) => IShapeBase,
    padding?: number
  ) => boolean;
  paint: (
    canvas2D: CanvasRenderingContext2D,
    calculateTruePosition: (shapeData: IShapeBase) => IShapeBase,
    selected: boolean,
    hovered: boolean,
    drawLabel: boolean,
    scale: number,
    isDownload: boolean
  ) => IShapeBase;
  hover: (isHovered: boolean, onShapeChange: () => void) => void;
  hovered: boolean;
  getAnnotationData: () => IAnnotation;
  adjustMark: (adjustBase: IShapeAdjustBase) => void;
  setComment: (comment: string) => void;
  equal: (data: IAnnotation) => boolean;
}

export class RectShape implements IShape {
  private annotationData: IAnnotation<IShapeData>;

  private onChangeCallBack: () => void;

  private getImageSize: () => { width: number; height: number };

  private dragStartOffset: { offsetX: number; offsetY: number };

  public hovered: boolean;

  constructor(
    data: IAnnotation<IShapeData>,
    onChange: () => void,
    getImageSize: () => { width: number; height: number }
  ) {
    this.annotationData = data;
    this.onChangeCallBack = onChange;
    this.getImageSize = getImageSize;
    this.hovered = false;
  }

  public onDragStart = (positionX: number, positionY: number) => {
    const { x, y, width, height } = this.annotationData.mark;
    if (width < 1 && height < 1) {
      const imageSize = this.getImageSize();
      this.dragStartOffset = {
        offsetX: positionX / imageSize.width - x,
        offsetY: positionY / imageSize.height - y,
      };
    } else {
      this.dragStartOffset = {
        offsetX: positionX - x,
        offsetY: positionY - y,
      };
    }
  };

  public onDrag = (positionX: number, positionY: number) => {
    if (this.dragStartOffset) {
      const { width, height } = this.annotationData.mark;
      if (width < 1 && height < 1) {
        const imageSize = this.getImageSize();
        this.annotationData.mark.x =
          positionX / imageSize.width - this.dragStartOffset.offsetX;
        this.annotationData.mark.y =
          positionY / imageSize.height - this.dragStartOffset.offsetY;
      } else {
        this.annotationData.mark.x = positionX - this.dragStartOffset.offsetX;
        this.annotationData.mark.y = positionY - this.dragStartOffset.offsetY;
      }
      this.onChangeCallBack();
    }
  };

  public checkBoundary = (
    positionX: number,
    positionY: number,
    calculateTruePosition: (shapeData: IShapeBase) => IShapeBase,
    padding = 0
  ) => {
    const { x, y, width, height } = calculateTruePosition(
      this.annotationData.mark
    );

    if (
      ((positionX > x - padding && positionX < x + width + padding) ||
        (positionX < x + padding && positionX > x + width - padding)) &&
      ((positionY > y - padding && positionY < y + height + padding) ||
        (positionY < y + padding && positionY > y + height - padding))
    ) {
      return true;
    }
    return false;
  };

  public hover = (isHovered: boolean, onShapeChange: () => void) => {
    if (isHovered !== this.hovered) {
      this.hovered = isHovered;
      onShapeChange();
    }
  };

  public paint = (
    canvas2D: CanvasRenderingContext2D,
    calculateTruePosition: (shapeData: IShapeBase) => IShapeBase,
    selected: boolean,
    hovered: boolean,
    drawLabel: boolean,
    scale: number,
    isDownload: boolean
  ) => {
    const { mark } = this.annotationData;
    const { x, y, width, height } = calculateTruePosition(mark);
    canvas2D.save();
    let shouldDraw = true;
    if (this.annotationData.mark.draw) {
      shouldDraw =
        this.annotationData.mark.draw(
          canvas2D,
          x,
          y,
          width,
          height,
          scale,
          isDownload
        ) || false;
    }
    if (shouldDraw) {
      const padding = 5;
      canvas2D.shadowBlur = 10;
      canvas2D.strokeStyle = mark.strokeColor || shapeStyle.shapeStrokeStyle;
      canvas2D.lineWidth = mark.strokeWidth || 4;
      if (mark.strokeWidth !== 0) {
        if (selected) {
          canvas2D.setLineDash([3]);
        }
        canvas2D.strokeRect(
          mark.highlight
            ? x - canvas2D.lineWidth / 2 - padding
            : x - canvas2D.lineWidth / 2,
          mark.highlight
            ? y - canvas2D.lineWidth / 2 - padding
            : y - canvas2D.lineWidth / 2,
          mark.highlight
            ? width + canvas2D.lineWidth + padding * 2
            : width + canvas2D.lineWidth,
          mark.highlight
            ? height + canvas2D.lineWidth + padding * 2
            : height + canvas2D.lineWidth
        );
      }
      if (selected || hovered) {
        canvas2D.fillStyle = mark.backgroundColor || shapeStyle.shapeBackground;
        canvas2D.fillRect(
          mark.highlight
            ? x - canvas2D.lineWidth / 2 - padding
            : x - canvas2D.lineWidth / 2,
          mark.highlight
            ? y - canvas2D.lineWidth / 2 - padding
            : y - canvas2D.lineWidth / 2,
          mark.highlight
            ? width + canvas2D.lineWidth + padding * 2
            : width + canvas2D.lineWidth,
          mark.highlight
            ? height + canvas2D.lineWidth + padding * 2
            : height + canvas2D.lineWidth
        );
      }
      const { comment, status } = this.annotationData;
      if (comment && drawLabel) {
        canvas2D.font = `${shapeStyle.fontSize}px ${shapeStyle.fontFamily}`;
        const textLength = canvas2D.measureText(comment);
        canvas2D.fillStyle = shapeStyle.fontBackground;
        canvas2D.fillRect(
          x - 2,
          y - 35,
          textLength.width + shapeStyle.padding * 2,
          shapeStyle.fontSize + shapeStyle.padding * 2
        );
        canvas2D.textBaseline = "top";
        canvas2D.fillStyle = shapeStyle.fontColor;
        canvas2D.fillText(
          comment,
          x + shapeStyle.padding - 2,
          y + shapeStyle.padding - 35
        );
      }
      if (status === "unhandled") {
        const centerX = x + width;
        const centerY = y;
        const radius = 5;

        canvas2D.setLineDash([0]);
        canvas2D.beginPath();
        canvas2D.shadowColor = "transparent";
        canvas2D.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        canvas2D.fillStyle = "#F74853";
        canvas2D.fill();
        canvas2D.lineWidth = 2;
        canvas2D.strokeStyle = Colors.white.hex();
        canvas2D.stroke();
      }
    }
    canvas2D.restore();

    return { x, y, width, height };
  };

  public adjustMark = ({
    x = this.annotationData.mark.x,
    y = this.annotationData.mark.y,
    width = this.annotationData.mark.width,
    height = this.annotationData.mark.height,
  }: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
    if (width > 0 && height > 0) {
      this.annotationData.mark.x = x;
      this.annotationData.mark.y = y;
      this.annotationData.mark.width = width;
      this.annotationData.mark.height = height;
      this.onChangeCallBack();
    }
  };

  public getAnnotationData = () => {
    return this.annotationData;
  };

  public setComment = (comment: string) => {
    this.annotationData.comment = comment;
  };

  public equal = (data: IAnnotation) => {
    return (
      data.id === this.annotationData.id &&
      data.comment === this.annotationData.comment &&
      data.mark.x === this.annotationData.mark.x &&
      data.mark.y === this.annotationData.mark.y &&
      data.mark.width === this.annotationData.mark.width &&
      data.mark.height === this.annotationData.mark.height
    );
  };
}
