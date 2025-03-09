import {
  calcBoundingBox,
  calcPerpendicularIntersection,
  calcCoordDistance,
  calcRelativeCoord,
  calcMatrix,
} from '@utils';
import type { Warpvas } from '../warpvas.class';

/**
 * Create canvas warping renderer with 2D context
 *
 * @param warpvas - Warpvas instance with deformation data
 * @param source - Source image canvas to be warped
 * @param destination - Target canvas element (creates new if null)
 * @param options - Rendering parameters { x, y, width, height, sourceScale?, destinationScale? }
 * @param utils - Required utility functions for coordinate calculations
 *
 * @returns Rendered canvas element with warped content
 *
 * @remarks
 * - Implements floating-point pixel anti-aliasing
 * - Uses vertex expansion to prevent triangle seams
 * - Supports OffscreenCanvas for worker thread rendering
 */
export const createWarpedCanvas = <Canvas extends HTMLCanvasElement | OffscreenCanvas>(
  warpvas: Warpvas,
  source: HTMLCanvasElement,
  destination: Canvas,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceScale?: number;
    destinationScale?: number;
  },
  utils: Record<string, (...args: any) => any>,
) => {
  const { x, y, sourceScale = 1, destinationScale = 1 } = options;
  const {
    gridColor = { r: 255, g: 0, b: 0, a: 1 },
    enableContentDisplay = true,
    enableGridDisplay = false,
    enableGridVertexDisplay = false,
  } = warpvas.renderingConfig ?? {};
  const {
    calcBoundingBox,
    calcPerpendicularIntersection,
    calcCoordDistance,
    calcRelativeCoord,
    calcMatrix,
  } = utils;

  /**
   * Calculate expanded vertex coordinates to prevent triangle seams
   *
   * @param a - Vertex to expand
   * @param b - Start point of opposite edge
   * @param c - End point of opposite edge
   * @param expandValue - Expansion distance in pixels (default: 1)
   *
   * @returns Expanded vertex coordinates
   */
  const calcExpandCoord = (a: Coord, b: Coord, c: Coord, expandValue = 1) => {
    const intersection = calcPerpendicularIntersection(b, c, a);
    const distance = calcCoordDistance(a, intersection);
    const f = calcRelativeCoord(a, intersection, distance + expandValue);
    return {
      x: f.x - intersection.x + b.x,
      y: f.y - intersection.y + b.y,
    };
  };

  const ctx = destination.getContext('2d')!;
  ctx.clearRect(0, 0, destination.width, destination.height);

  const expandSize = 1;
  const scaleExpandSize = Math.ceil(expandSize / (sourceScale * destinationScale));

  // Apply coordinate transformation
  ctx.save();
  ctx.transform(
    sourceScale * destinationScale,
    0,
    0,
    sourceScale * destinationScale,
    x * sourceScale * destinationScale,
    y * sourceScale * destinationScale,
  );

  /**
   * Render deformed triangle primitive with anti-aliasing
   *
   * @param a - Transformed triangle vertex A coordinates
   * @param a0 - Original triangle vertex A coordinates
   * @param b - Transformed triangle vertex B coordinates
   * @param b0 - Original triangle vertex B coordinates
   * @param c - Transformed triangle vertex C coordinates
   * @param c0 - Original triangle vertex C coordinates
   * @param position - Source image starting position
   */
  const renderTriangleImage = (
    a: Coord,
    a0: Coord,
    b: Coord,
    b0: Coord,
    c: Coord,
    c0: Coord,
    position: Coord,
  ) => {
    // Clip path configuration
    const dots = [a, b, c];
    const clipPath = new Path2D();
    for (let i = 0; i < 3; i++) {
      const p0 = dots[i];
      const p1 = dots[(i + 1) % 3];
      const p2 = dots[(i + 2) % 3];

      // Legacy approach (causes visible seams due to floating-point precision)
      // clipPath.lineTo(p0.x, p0.y);

      // Expand vertices to prevent rendering artifacts
      const expandP1 = calcExpandCoord(p0, p1, p2, scaleExpandSize);
      const expandP2 = calcExpandCoord(p0, p2, p1, scaleExpandSize);

      clipPath.lineTo(expandP1.x, expandP1.y);
      clipPath.lineTo(expandP2.x, expandP2.y);
    }

    if (enableContentDisplay) {
      ctx.save();

      ctx.clip(clipPath);

      // Calculate affine transformation matrix
      const matrix = calcMatrix([a, b, c], [a0, b0, c0]);
      // @ts-ignore
      ctx.transform(...matrix);

      // Draw warped image section
      const bbox = calcBoundingBox(a0, b0, c0);
      const sx = (position.x - expandSize) * sourceScale;
      const sy = (position.y - expandSize) * sourceScale;
      const sw = (bbox.width + expandSize * 2) * sourceScale;
      const sh = (bbox.height + expandSize * 2) * sourceScale;
      const dx = position.x - expandSize / sourceScale;
      const dy = position.y - expandSize / sourceScale;
      const dw = bbox.width + (expandSize * 2) / sourceScale;
      const dh = bbox.height + (expandSize * 2) / sourceScale;
      ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);

      ctx.restore();
    }

    // Render grid vertices (debug visualization)
    if (enableGridVertexDisplay) {
      const size = Math.floor(2 / sourceScale);
      ctx.fillStyle = `rgba(${gridColor.r}, ${gridColor.g}, ${gridColor.b}, ${gridColor.a})`;
      ctx.fillRect(a.x - size / 2, a.y - size / 2, size, size);
    }

    // Render wireframe overlay (debug mode)
    if (enableGridDisplay) {
      const size = Math.floor(1 / sourceScale);
      ctx.lineWidth = size;
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.stroke(clipPath);
    }
  };

  // Render all triangle primitives in the deformation grid
  warpvas.regionPoints.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      const points = col;
      const columns = warpvas.regionCurves[rowIndex][colIndex].vertical.length - 1;
      points.forEach((_, i) => {
        // Get quadrilateral vertices for current cell
        const a = points[i];
        const b = points[i + 1];
        const c = points[i + columns + 2];
        const d = points[i + columns + 1];

        // Get original quadrilateral vertices for source mapping
        const a0 = warpvas.originalRegionPoints[rowIndex][colIndex][i];
        const b0 = warpvas.originalRegionPoints[rowIndex][colIndex][i + 1];
        const c0 = warpvas.originalRegionPoints[rowIndex][colIndex][i + columns + 2];
        const d0 = warpvas.originalRegionPoints[rowIndex][colIndex][i + columns + 1];

        if (b && c && i % (columns + 1) < columns) {
          // Render upper triangle section (ABD)
          renderTriangleImage(a, a0, b, b0, d, d0, a0);
          // Render lower triangle section (CBD)
          renderTriangleImage(c, c0, b, b0, d, d0, a0);
        }
      });
    });
  });

  ctx.restore();

  return destination;
};

/**
 * Create warped canvas instance using Canvas2D API
 *
 * @param warpvas - Warpvas instance containing deformation configuration
 * @param source - Source image canvas element
 * @param destination - Target canvas (creates new canvas if null)
 * @param options - Rendering parameters {
 *   x: Render starting X coordinate,
 *   y: Render starting Y coordinate,
 *   width: Output width,
 *   height: Output height,
 *   sourceScale?: Image scaling factor (default: 1),
 *   destinationScale?: Canvas scaling factor (default: 1)
 * }
 *
 * @returns Created warped canvas instance using Canvas2D
 */
const createWarpedCanvas2D = (
  warpvas: Warpvas,
  source: HTMLCanvasElement,
  destination: HTMLCanvasElement | null,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceScale?: number;
    destinationScale?: number;
  },
) => {
  const { width, height, sourceScale = 1, destinationScale = 1 } = options;

  destination = destination ?? document.createElement('canvas');
  destination.width = width * destinationScale * sourceScale;
  destination.height = height * destinationScale * sourceScale;

  const canvas = createWarpedCanvas(warpvas, source, destination, options, {
    calcBoundingBox,
    calcPerpendicularIntersection,
    calcCoordDistance,
    calcRelativeCoord,
    calcMatrix,
  });

  return canvas;
};

export default createWarpedCanvas2D;
