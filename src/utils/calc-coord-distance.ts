/**
 * Calculate Euclidean distance between two coordinates
 *
 * @param a - First point {x: number, y: number}
 * @param b - Second point coordinates
 *
 * @returns Non-negative distance value
 */
export const calcCoordDistance = (a: Coord, b: Coord) => {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
};
