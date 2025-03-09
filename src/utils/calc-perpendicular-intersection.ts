/**
 * Calculate foot of perpendicular from point to line
 *
 * @param p1 - Line start point {x: number, y: number}
 * @param p2 - Line end point coordinates
 * @param p0 - Target point coordinates
 *
 * @returns Foot coordinates on the line
 *
 * @example
 * ```typescript
 * // Vertical line example
 * const foot = calcPerpendicularIntersection(
 *   {x:0,y:10}, {x:20,y:10}, {x:5,y:15}
 * ); // {x:5, y:10}
 * ```
 *
 * @remarks
 * - Input points must define a valid line
 * - Works for infinite lines (not limited to segments)
 */
export const calcPerpendicularIntersection = (p1: Coord, p2: Coord, p0: Coord): Coord => {
  // Handle vertical line (parallel to Y-axis)
  if (p1.x === p2.x) {
    return { x: p1.x, y: p0.y };
  }

  // Handle horizontal line (parallel to X-axis)
  if (p1.y === p2.y) {
    return { x: p0.x, y: p1.y };
  }

  // Calculate slope of line through p1-p2
  const slope = (p2.y - p1.y) / (p2.x - p1.x);

  // Calculate perpendicular slope
  const slopePerpendicular = -1 / slope;

  // Solve intersection using linear equations
  const x =
    (-slope * p1.x + p1.y + slopePerpendicular * p0.x - p0.y) / (slopePerpendicular - slope);
  const y = slope * (x - p1.x) + p1.y;

  return { x, y };
};
