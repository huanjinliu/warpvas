import { calcCoordDistance, calcPerpendicularIntersection, calcRelativeCoord } from '@utils';

/**
 * Extend point along perpendicular direction from line segment
 *
 * @param a - Target point coordinates {x: number, y: number}
 * @param b - Reference line start point
 * @param c - Reference line end point
 * @param expandValue - Extension distance (default: 1 unit)
 *
 * @returns Extended coordinates
 *
 * @example
 * ```typescript
 * // Basic usage
 * const expanded = calcExpandCoord(
 *   {x:0,y:0}, {x:-1,y:1}, {x:1,y:1}
 * ); // Moves 1 unit away from line
 * ```
 *
 * @remarks
 * - Extension direction always perpendicular to line
 */
export const calcExpandCoord = (a: Coord, b: Coord, c: Coord, expandValue = 1) => {
  // Find foot of perpendicular from a to bc line
  const intersection = calcPerpendicularIntersection(b, c, a);

  // Calculate extension distance
  const distance = calcCoordDistance(a, intersection);

  // Extend along perpendicular direction
  const f = calcRelativeCoord(a, intersection, distance + expandValue);

  return {
    x: f.x - intersection.x + b.x,
    y: f.y - intersection.y + b.y,
  };
};
