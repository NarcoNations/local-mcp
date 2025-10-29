declare module "canvas" {
  interface CanvasRenderingContext2DLike {
    canvas: CanvasLike;
    fillStyle: string;
    fillRect(x: number, y: number, width: number, height: number): void;
    imageSmoothingEnabled?: boolean;
  }

  interface CanvasLike {
    width: number;
    height: number;
    getContext(type: "2d"): CanvasRenderingContext2DLike | undefined;
    toBuffer(type?: string): Buffer;
  }

  function createCanvas(width: number, height: number): CanvasLike;

  export { CanvasLike as Canvas, CanvasRenderingContext2DLike as CanvasRenderingContext2D, createCanvas };
}
