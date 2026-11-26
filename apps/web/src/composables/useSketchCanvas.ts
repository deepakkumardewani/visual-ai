import { computed, ref, type Ref } from 'vue';

export type SketchTool = 'brush' | 'eraser';

export interface SketchPoint {
  x: number;
  y: number;
}

export interface SketchStroke {
  tool: SketchTool;
  size: number;
  points: SketchPoint[];
}

export const SKETCH_CANVAS_SIZE = 1024;
export const SKETCH_BRUSH_SIZE = { min: 2, max: 48, default: 8 } as const;
const PAPER_COLOR = '#ffffff';
const INK_COLOR = '#111111';
const SKETCH_FILE_NAME = 'sketch.png';
const SKETCH_MIME = 'image/png';

/** Strokes are the source of truth, so undo is a replay of all but the last one. */
export function paintStroke(ctx: CanvasRenderingContext2D, stroke: SketchStroke): void {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  ctx.strokeStyle = stroke.tool === 'eraser' ? PAPER_COLOR : INK_COLOR;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const point of rest) ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function fillPaper(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, SKETCH_CANVAS_SIZE, SKETCH_CANVAS_SIZE);
}

export function useSketchCanvas(canvas: Ref<HTMLCanvasElement | null>) {
  const tool = ref<SketchTool>('brush');
  const size = ref<number>(SKETCH_BRUSH_SIZE.default);
  const strokes = ref<SketchStroke[]>([]);
  let active: SketchStroke | null = null;

  // Only ink counts: a canvas of erased strokes is still blank.
  const hasContent = computed(() => strokes.value.some((stroke) => stroke.tool === 'brush'));
  const canUndo = computed(() => strokes.value.length > 0);

  function context(): CanvasRenderingContext2D | null {
    return canvas.value?.getContext('2d') ?? null;
  }

  function redraw() {
    const ctx = context();
    if (!ctx) return;
    fillPaper(ctx);
    strokes.value.forEach((stroke) => paintStroke(ctx, stroke));
  }

  function toCanvasPoint(event: PointerEvent): SketchPoint {
    const rect = canvas.value!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SKETCH_CANVAS_SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SKETCH_CANVAS_SIZE,
    };
  }

  function start(event: PointerEvent) {
    if (!canvas.value) return;
    canvas.value.setPointerCapture(event.pointerId);
    active = {
      tool: tool.value,
      size: size.value,
      points: [toCanvasPoint(event)],
    };
    strokes.value = [...strokes.value, active];
    redraw();
  }

  function move(event: PointerEvent) {
    if (!active) return;
    active.points.push(toCanvasPoint(event));
    redraw();
  }

  function end() {
    active = null;
  }

  function undo() {
    strokes.value = strokes.value.slice(0, -1);
    redraw();
  }

  function clear() {
    strokes.value = [];
    redraw();
  }

  /** Flattened PNG on white, the shape the reference-image upload expects. */
  function toFile(): Promise<File | null> {
    return new Promise((resolve) => {
      canvas.value?.toBlob(
        (blob) => resolve(blob ? new File([blob], SKETCH_FILE_NAME, { type: SKETCH_MIME }) : null),
        SKETCH_MIME,
      );
      if (!canvas.value) resolve(null);
    });
  }

  return {
    tool,
    size,
    strokes,
    hasContent,
    canUndo,
    redraw,
    start,
    move,
    end,
    undo,
    clear,
    toFile,
  };
}
