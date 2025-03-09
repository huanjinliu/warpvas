/**
 * Calculate coordinates along a line at specified distance
 *
 * @param p0 - Start point coordinates {x: number, y: number}
 * @param p1 - Direction reference point coordinates
 * @param value - Distance to move (positive: towards p1, negative: opposite)
 *
 * @returns New coordinates along the line segment
 *
 * @example
 * ```typescript
 * // Horizontal movement
 * const start = { x: 0, y: 0 };
 * const end = { x: 10, y: 0 };
 * console.log(calcRelativeCoord(start, end, 5)); // {x:5, y:0}
 *
 * // Diagonal movement
 * console.log(calcRelativeCoord(start, {x:3,y:4}, 5)); // {x:3, y:4}
 * ```
 *
 * @remarks
 * - Returns p0 when points coincide
 * - Handles vertical/horizontal/sloped lines
 * - Subject to JS floating-point precision
 */
export const calcRelativeCoord = (p0: Coord, p1: Coord, value: number): Coord => {
  const coord = { ...p0 }; // Create new coordinate initialized with p0
  const d = {
    x: p1.x - p0.x,
    y: p1.y - p0.y,
  };

  // Return original point if coordinates coincide
  if (d.x === 0 && d.y === 0) return coord;

  // Handle vertical/horizontal cases
  if (d.x === 0) {
    coord.y += value * Math.sign(d.y); // Move along Y-axis
  } else if (d.y === 0) {
    coord.x += value * Math.sign(d.x); // Move along X-axis
  } else {
    const distance = Math.sqrt(d.x ** 2 + d.y ** 2);
    coord.x += d.x * (value / distance);
    coord.y += d.y * (value / distance);
  }

  return coord;
};
