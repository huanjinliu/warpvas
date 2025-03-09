/**
 * Calculate intersection point of two line segments
 *
 * @param p1 - Line 1 start point {x: number, y: number}
 * @param p2 - Line 1 end point
 * @param p3 - Line 2 start point
 * @param p4 - Line 2 end point
 *
 * @returns Intersection coordinates or null for parallel lines
 *
 * @example
 * ```typescript
 * // Intersecting lines
 * calcIntersection({x:0,y:0}, {x:2,y:2}, {x:0,y:2}, {x:2,y:0}); // {x:1,y:1}
 *
 * // Parallel lines
 * calcIntersection({x:0,y:0}, {x:1,y:1}, {x:0,y:1}, {x:1,y:2}); // null
 * ```
 *
 * @remarks
 * - Handles vertical/horizontal edge cases
 * - Uses 1e4 scaling factor for floating-point precision
 * - 0.1**12 parallel threshold
 */
export const calcIntersection = (p1: Coord, p2: Coord, p3: Coord, p4: Coord): Coord | null => {
  // Check parallel lines
  const isAapproximate = (number1: number, number2: number) => {
    return Math.abs(number1 - number2) < 0.1 ** 12;
  };
  if (isAapproximate(p1.x, p2.x) && isAapproximate(p3.x, p4.x)) return null;
  if (isAapproximate(p1.y, p2.y) && isAapproximate(p3.y, p4.y)) return null;

  // Calculate slopes with precision scaling
  const m1 = ((p2.y - p1.y) * 1e4) / Math.round((p2.x - p1.x) * 1e4);
  const m2 = ((p4.y - p3.y) * 1e4) / Math.round((p4.x - p3.x) * 1e4);

  // Calculate intercepts
  const b1 = p1.y - m1 * p1.x;
  const b2 = p3.y - m2 * p3.x;

  // Handle vertical line cases
  if (Math.abs(m1) === Infinity) return { x: p1.x, y: m2 * p1.x + b2 };
  if (Math.abs(m2) === Infinity) return { x: p3.x, y: m1 * p3.x + b1 };

  // Calculate intersection
  const x = (b2 - b1) / (m1 - m2);
  const y = m1 * x + b1;

  return { x, y };
};
