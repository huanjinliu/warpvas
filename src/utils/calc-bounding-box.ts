/**
 * Calculate minimum bounding box enclosing a triangle
 *
 * @param a - First vertex coordinates {x: number, y: number}
 * @param b - Second vertex coordinates
 * @param c - Third vertex coordinates
 *
 * @returns Bounding box dimensions {width: number, height: number}
 *
 * @example
 * ```typescript
 * // Equilateral triangle bounding box
 * calcBoundingBox(
 *   {x:0,y:0}, {x:100,y:0}, {x:50,y:86.6}
 * ); // {width: 100, height: 86.6}
 * ```
 *
 * @remarks
 * - Dimensions are always non-negative
 * - Handles floating-point coordinates
 */
export const calcBoundingBox = (a: Coord, b: Coord, c: Coord) => {
  const minX = Math.min(a.x, b.x, c.x);
  const maxX = Math.max(a.x, b.x, c.x);
  const minY = Math.min(a.y, b.y, c.y);
  const maxY = Math.max(a.y, b.y, c.y);

  const width = maxX - minX;
  const height = maxY - minY;

  return { width, height };
};
