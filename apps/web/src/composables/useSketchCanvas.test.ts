import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import {
  paintStroke,
  SKETCH_BRUSH_SIZE,
  SKETCH_CANVAS_SIZE,
  type SketchStroke,
  useSketchCanvas,
} from '@/composables/useSketchCanvas';

function fakeContext() {
  return {
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
  };
}

function fakeCanvas(ctx: ReturnType<typeof fakeContext> | null = fakeContext()) {
  const canvas = {
    getContext: vi.fn(() => ctx),
    setPointerCapture: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 10, top: 20, width: 512, height: 512 })),
    toBlob: vi.fn((cb: (blob: Blob | null) => void) =>
      cb(new Blob(['png'], { type: 'image/png' })),
    ),
  };
  return { canvas, ctx };
}

function pointer(clientX: number, clientY: number) {
  return { clientX, clientY, pointerId: 1 } as PointerEvent;
}

function setup(ctx: ReturnType<typeof fakeContext> | null = fakeContext()) {
  const { canvas } = fakeCanvas(ctx);
  const sketch = useSketchCanvas(ref(canvas as unknown as HTMLCanvasElement));
  return { canvas, ctx, sketch };
}

afterEach(() => vi.restoreAllMocks());

describe('paintStroke', () => {
  it('paints nothing for a stroke with no points', () => {
    const ctx = fakeContext();
    paintStroke(ctx as unknown as CanvasRenderingContext2D, { tool: 'brush', size: 4, points: [] });
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it('uses ink for the brush and paper white for the eraser', () => {
    const ctx = fakeContext();
    const base: SketchStroke = {
      tool: 'brush',
      size: 6,
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
    };
    paintStroke(ctx as unknown as CanvasRenderingContext2D, base);
    expect(ctx.strokeStyle).toBe('#111111');
    expect(ctx.lineWidth).toBe(6);
    expect(ctx.lineTo).toHaveBeenCalledWith(3, 4);
    paintStroke(ctx as unknown as CanvasRenderingContext2D, { ...base, tool: 'eraser' });
    expect(ctx.strokeStyle).toBe('#ffffff');
  });
});

describe('useSketchCanvas', () => {
  it('starts blank with default brush settings and nothing to undo', () => {
    const { sketch } = setup();
    expect(sketch.tool.value).toBe('brush');
    expect(sketch.size.value).toBe(SKETCH_BRUSH_SIZE.default);
    expect(sketch.hasContent.value).toBe(false);
    expect(sketch.canUndo.value).toBe(false);
  });

  it('records a stroke in canvas coordinates scaled from the element size', () => {
    const { canvas, sketch } = setup();
    sketch.start(pointer(10 + 256, 20 + 128));
    sketch.move(pointer(10 + 512, 20 + 512));
    sketch.end();
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    expect(sketch.strokes.value).toHaveLength(1);
    expect(sketch.strokes.value[0]?.points).toEqual([
      { x: SKETCH_CANVAS_SIZE / 2, y: SKETCH_CANVAS_SIZE / 4 },
      { x: SKETCH_CANVAS_SIZE, y: SKETCH_CANVAS_SIZE },
    ]);
    expect(sketch.hasContent.value).toBe(true);
    expect(sketch.canUndo.value).toBe(true);
  });

  it('ignores moves when no stroke is active', () => {
    const { sketch } = setup();
    sketch.move(pointer(50, 50));
    expect(sketch.strokes.value).toEqual([]);
    sketch.start(pointer(50, 50));
    sketch.end();
    sketch.move(pointer(80, 80));
    expect(sketch.strokes.value[0]?.points).toHaveLength(1);
  });

  it('captures the selected tool and size on the stroke', () => {
    const { sketch } = setup();
    sketch.tool.value = 'eraser';
    sketch.size.value = 30;
    sketch.start(pointer(10, 20));
    expect(sketch.strokes.value[0]).toMatchObject({ tool: 'eraser', size: 30 });
  });

  it('does not count erase-only strokes as content', () => {
    const { sketch } = setup();
    sketch.tool.value = 'eraser';
    sketch.start(pointer(10, 20));
    sketch.end();
    expect(sketch.hasContent.value).toBe(false);
    expect(sketch.canUndo.value).toBe(true);
  });

  it('undo removes only the last stroke and replays the rest', () => {
    const { ctx, sketch } = setup();
    sketch.start(pointer(10, 20));
    sketch.end();
    sketch.start(pointer(100, 100));
    sketch.end();
    ctx!.fillRect.mockClear();
    sketch.undo();
    expect(sketch.strokes.value).toHaveLength(1);
    expect(ctx!.fillRect).toHaveBeenCalledWith(0, 0, SKETCH_CANVAS_SIZE, SKETCH_CANVAS_SIZE);
  });

  it('undo on an empty history stays empty', () => {
    const { sketch } = setup();
    sketch.undo();
    expect(sketch.strokes.value).toEqual([]);
  });

  it('clear removes every stroke', async () => {
    const { sketch } = setup();
    sketch.start(pointer(10, 20));
    sketch.end();
    sketch.clear();
    await nextTick();
    expect(sketch.strokes.value).toEqual([]);
    expect(sketch.hasContent.value).toBe(false);
  });

  it('redraw and gestures are safe when the 2d context is unavailable', () => {
    const { sketch } = setup(null);
    expect(() => {
      sketch.redraw();
      sketch.start(pointer(10, 20));
      sketch.move(pointer(11, 21));
    }).not.toThrow();
    expect(sketch.strokes.value).toHaveLength(1);
  });

  it('start does nothing without a canvas element', () => {
    const sketch = useSketchCanvas(ref(null));
    sketch.start(pointer(1, 1));
    expect(sketch.strokes.value).toEqual([]);
    sketch.redraw();
  });

  it('exports a flattened PNG file', async () => {
    const { sketch } = setup();
    const file = await sketch.toFile();
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe('sketch.png');
    expect(file?.type).toBe('image/png');
  });

  it('resolves null when the canvas cannot produce a blob', async () => {
    const { canvas, sketch } = setup();
    canvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => cb(null));
    expect(await sketch.toFile()).toBeNull();
  });

  it('resolves null when there is no canvas', async () => {
    expect(await useSketchCanvas(ref(null)).toFile()).toBeNull();
  });
});
