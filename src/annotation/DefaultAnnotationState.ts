import ReactPictureAnnotation from "../ReactPictureAnnotation";
import { RectShape } from "../Shape";
import randomId from "../utils/randomId";
import { IAnnotationState } from "./AnnotationState";
import CreatingAnnotationState from "./CreatingAnnotationState";
import DraggingAnnotationState from "./DraggingAnnotationState";

export class DefaultAnnotationState implements IAnnotationState {
  private context: ReactPictureAnnotation;
  constructor(context: ReactPictureAnnotation) {
    this.context = context;
  }
  public onMouseMove = () => undefined;
  public onMouseUp = () => undefined;

  public onMouseDown = (positionX: number, positionY: number) => {
    const {
      shapes,
      onShapeChange,
      setAnnotationState: setState
    } = this.context;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].checkBoundary(positionX, positionY)) {
        this.context.selectedId = shapes[i].getAnnotationData().id;
        const [selectedShape] = shapes.splice(i, 1);
        shapes.push(selectedShape);
        selectedShape.onDragStart(positionX, positionY);
        onShapeChange();
        setState(new DraggingAnnotationState(this.context));
        return;
      }
    }
    this.context.shapes.push(
      new RectShape(
        {
          id: randomId(),
          mark: {
            x: positionX,
            y: positionY,
            width: 0,
            height: 0,
            type: "RECT"
          }
        },
        onShapeChange
      )
    );

    setState(new CreatingAnnotationState(this.context));
  };
}
