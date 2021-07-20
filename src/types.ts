export interface IPoint {
  x: number;
  y: number;
}

export interface IDrawingLine {
  points: IPoint[];
  brushColor: string;
  brushRadius: number;
}
