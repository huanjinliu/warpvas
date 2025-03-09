import React, { useCallback, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { loadFont } from 'docs/utils';
import { Warpvas } from 'warpvas';

const CANVAS_PADDING = 8;
const LOGO_WIDTH = 460;
const LOGO_HEIGHT = 150;
const INDICATOR_THEME_COLOR = 'rgba(206, 102, 91, 1)';
const INDICATOR_SUB_THEME_COLOR = 'rgba(206, 102, 91, 0.6)';

const createLOGO = () => {
  const width = LOGO_WIDTH;
  const height = LOGO_HEIGHT;

  const background = new fabric.Rect({
    width: width,
    height: height,
    left: width / 2,
    fill: 'transparent',
    originX: 'center',
  });

  const title = new fabric.Text('Warpvas', {
    left: width / 2,
    top: 24,
    fontSize: 50,
    fontFamily: 'sharpie-black',
    originX: 'center',
    originY: 'top',
  });

  const description = new fabric.Text('A JavaScript Library for Rapid Canvas Distortion', {
    left: width / 2,
    top: 126,
    fontSize: 16,
    fontFamily: 'handwriting',
    originX: 'center',
    originY: 'bottom',
  });

  const group = new fabric.Group([background, title, description], {
    originX: 'center',
    originY: 'center',
  });

  return group.toCanvasElement({ enableRetinaScaling: true });
};

const createPath = (path: string, options: fabric.IPathOptions = {}) => {
  return new fabric.Path(path, {
    fill: 'transparent',
    stroke: INDICATOR_SUB_THEME_COLOR,
    strokeWidth: 1,
    strokeDashArray: [2, 2],
    ...options,
  });
};

const createLine = (p0: Coord, p1: Coord, options: fabric.ILineOptions = {}) => {
  return new fabric.Line([p0.x, p0.y, p1.x, p1.y], {
    stroke: INDICATOR_SUB_THEME_COLOR,
    strokeWidth: 1,
    ...options,
  });
};

const createPoint = (options: fabric.ICircleOptions = {}) => {
  return new fabric.Circle({
    radius: 4,
    fill: INDICATOR_THEME_COLOR,
    stroke: INDICATOR_SUB_THEME_COLOR,
    strokeWidth: 6,
    originX: 'center',
    originY: 'center',
    ...options,
  });
};

const createRect = (width: number, height: number, options: fabric.IRectOptions = {}) => {
  return new fabric.Rect({
    width,
    height,
    fill: 'transparent',
    stroke: INDICATOR_SUB_THEME_COLOR,
    strokeWidth: 1,
    strokeDashArray: [2, 2],
    ...options,
  });
};

const createLabel = (text: string, options: fabric.TextOptions = {}) => {
  return new fabric.Text(text, {
    fontSize: 12,
    fontFamily: 'handwriting',
    fill: INDICATOR_THEME_COLOR,
    originX: 'center',
    originY: 'top',
    ...options,
  });
};

const WarpedCanvas: React.FC<{ className?: string; step: number }> = ({ className, step }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.StaticCanvas>();

  const initialWarpedCanvas = useCallback(async (step: number) => {
    if (!canvasRef.current) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    await loadFont('sharpie-black');
    await loadFont('handwriting');

    const offset = (...objects: fabric.Object[]) => {
      objects.map((object) => {
        (object as any).set({
          left: object.left! + CANVAS_PADDING,
          top: object.top! + CANVAS_PADDING,
        });
      });
      return objects;
    };

    const applyDistortionEffects = (warpvas: Warpvas, step: number) => {
      const ratio = window.devicePixelRatio;
      switch (step) {
        case 2: {
          warpvas.updateVertexCoord(0, 0, 'tl', { x: 50 * ratio, y: 50 * ratio }, true);
          break;
        }
        case 3: {
          warpvas.updateRegionBoundCoords(0, 0, 'bottom', [
            { x: 0, y: LOGO_HEIGHT * ratio },
            { x: (LOGO_WIDTH * ratio) / 3, y: (LOGO_HEIGHT * ratio) / 2 },
            { x: ((LOGO_WIDTH * ratio) / 3) * 2, y: (LOGO_HEIGHT * ratio) / 2 },
            { x: LOGO_WIDTH * ratio, y: LOGO_HEIGHT * ratio },
          ]);
          break;
        }
        case 4: {
          const region = warpvas.originalRegions[0][0];
          warpvas.splitRegionByPoint(
            0,
            0,
            {
              x: (region.tl.x + region.br.x) / 2,
              y: (region.tl.y + region.br.y) / 2,
            },
            0.1,
          );
          break;
        }
        case 6: {
          warpvas.setRenderingConfig({
            enableGridDisplay: true,
            enableGridVertexDisplay: true,
            gridColor: { r: 206, g: 102, b: 91, a: 1 },
          });
          break;
        }
        case 7: {
          warpvas.setSplitUnit(0.02).setRenderingConfig({
            enableGridDisplay: true,
            gridColor: { r: 206, g: 102, b: 91, a: 1 },
          });
          break;
        }
        case 9: {
          warpvas.setInputLimitSize({
            height: 100 * ratio,
          });
          break;
        }
        case 10: {
          warpvas.setOutputLimitSize({
            height: 100 * ratio,
          });
          break;
        }
        case 11: {
          warpvas.setRenderingContext('2d');
          break;
        }
      }
    };

    const addIndicators = (canvas: fabric.StaticCanvas, step: number) => {
      switch (step) {
        case 2: {
          const path = createPath(`M 0 ${LOGO_HEIGHT} L 50 50 L ${LOGO_WIDTH} 0`);
          const point = createPoint({
            left: 50,
            top: 50,
          });
          const text = createLabel('Move to (50, 50)', {
            left: 50,
            top: 50 + 20,
          });
          canvas.add(...offset(path, point, text));
          break;
        }
        case 3: {
          const curve = [
            { x: 0, y: LOGO_HEIGHT },
            { x: LOGO_WIDTH / 3, y: LOGO_HEIGHT / 2 },
            { x: (LOGO_WIDTH / 3) * 2, y: LOGO_HEIGHT / 2 },
            { x: LOGO_WIDTH, y: LOGO_HEIGHT },
          ];
          const path = createPath(
            `M 0 ${LOGO_HEIGHT} C ${curve
              .slice(1)
              .map((i) => `${i.x} ${i.y}`)
              .join(' ')}`,
          );
          const lines = [
            [curve[0], curve[1]],
            [curve[2], curve[3]],
          ].map(([p0, p1]) => {
            return createLine(p0, p1);
          });
          const points = curve.map((pos) => {
            return createPoint({
              left: pos.x,
              top: pos.y,
            });
          });
          canvas.add(...offset(path, ...lines, ...points));
          break;
        }
        case 4: {
          const path = createPath(
            `M 0 ${LOGO_HEIGHT / 2} L ${LOGO_WIDTH} ${LOGO_HEIGHT / 2} M ${LOGO_WIDTH / 2} 0 L ${LOGO_WIDTH / 2} ${LOGO_HEIGHT}`,
          );
          const point = createPoint({
            left: LOGO_WIDTH / 2,
            top: LOGO_HEIGHT / 2,
          });
          const text = createLabel('Split at center', {
            left: LOGO_WIDTH / 2,
            top: LOGO_HEIGHT / 2 + 20,
          });
          canvas.add(...offset(path, point, text));
          break;
        }
        case 5: {
          const rect1 = createRect(LOGO_WIDTH / 2, LOGO_HEIGHT, {
            left: LOGO_WIDTH / 2,
            top: 0,
          });
          const rect2 = createRect(LOGO_WIDTH, LOGO_HEIGHT / 2, {
            left: 0,
            top: LOGO_HEIGHT / 2,
          });
          const text = createLabel('Remove region at row 1, column 1', {
            left: LOGO_WIDTH / 2,
            top: LOGO_HEIGHT / 2 + 10,
          });
          canvas.add(...offset(rect1, rect2, text));
          break;
        }
        case 9:
        case 10: {
          const path = createPath(`M 0 100 L 0 0`);
          const text = createLabel('Limit height to 100px', {
            left: 10,
            top: 100 / 2,
            originX: 'left',
          });
          canvas.add(...offset(path, text));
          break;
        }
      }
    };

    // Generate pre-deformation canvas
    const logoCanvas = createLOGO();

    // Apply deformation based on steps
    const warpvas = new Warpvas(logoCanvas);
    applyDistortionEffects(warpvas, step);
    const warpedCanvas = warpvas.render();

    const image = new fabric.Image(warpedCanvas, {
      originX: 'center',
      originY: 'center',
      scaleX: 1 / window.devicePixelRatio,
      scaleY: 1 / window.devicePixelRatio,
    });

    // Generate preview canvas
    const canvas = canvasRef.current;
    const fabricCanvas = new fabric.StaticCanvas(canvas, {
      width: image.getScaledWidth() + CANVAS_PADDING * 2,
      height: image.getScaledHeight() + CANVAS_PADDING * 2,
    });
    image.set({
      left: fabricCanvas.getWidth() / 2,
      top: fabricCanvas.getHeight() / 2,
    });
    fabricCanvas.add(image);

    // Add hint elements
    addIndicators(fabricCanvas, step);

    fabricCanvasRef.current = fabricCanvas;
  }, []);

  useEffect(() => {
    initialWarpedCanvas(step);
  }, [step]);

  return (
    <div className={className}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default WarpedCanvas;
