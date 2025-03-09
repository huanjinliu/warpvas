/**
 * Determines if a point is inside/on a triangle using area comparison method
 *
 * @param p - Target point coordinates {x: number, y: number}
 * @param a - Triangle vertex A coordinates
 * @param b - Triangle vertex B coordinates
 * @param c - Triangle vertex C coordinates
 * @param tolerate - Tolerance for floating-point precision (default: 0.1)
 *
 * @returns True if point is inside or on triangle edges
 *
 * @example
 * ```typescript
 * // Check point in equilateral triangle
 * const a = { x: 0, y: 0 };
 * const b = { x: 1, y: 0 };
 * const c = { x: 0.5, y: 0.866 };
 *
 * console.log(isTriangleContainsPoint({x: 0.5, y: 0.289}, a, b, c)); // true
 * console.log(isTriangleContainsPoint({x: 2, y: 2}, a, b, c)); // false
 * ```
 *
 * @remarks
 * - Uses determinant for area calculation
 * - Edge points are considered inside
 * - Vertex order insensitive
 */
export const isTriangleContainsPoint = (p: Coord, a: Coord, b: Coord, c: Coord, tolerate = 0.1) => {
  // Calculate triangle area using determinant
  const area = (p1: Coord, p2: Coord, p3: Coord) =>
    Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;

  const areaABC = area(a, b, c);
  const areaABD = area(a, b, p);
  const areaBCD = area(b, c, p);
  const areaCAD = area(c, a, p);

  // Check if sub-areas sum with tolerance
  return areaABD + areaBCD + areaCAD <= areaABC + tolerate;
};
