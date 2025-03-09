/**
 * Collection of geometric calculation utilities
 *
 * Provides a set of utility functions for geometric computations:
 *
 * Basic geometric operations:
 * - calcIntersection: Calculate intersection point of two line segments
 * - calcPerpendicularIntersection: Find foot of perpendicular from point to line
 * - calcCoordDistance: Compute distance between two coordinates
 * - calcExpandCoord: Calculate expanded coordinate based on direction
 * - calcBoundingBox: Compute bounding box of triangle
 * - calcRelativeCoord: Transform coordinate to relative position
 *
 * Transforms & predicates:
 * - calcMatrix: Compute affine transformation matrix
 * - isTriangleContainsPoint: Determine if point is inside triangle
 *
 * @remarks
 * - All coordinates use {x: number, y: number} format
 * - Tolerance handling included for floating-point precision issues
 */

export { calcIntersection } from './calc-intersection';
export { calcPerpendicularIntersection } from './calc-perpendicular-intersection';
export { calcCoordDistance } from './calc-coord-distance';
export { calcExpandCoord } from './calc-expand-coord';
export { calcBoundingBox } from './calc-bounding-box';
export { calcRelativeCoord } from './calc-relative-coord';
export { calcMatrix } from './calc-matrix';
export { isTriangleContainsPoint } from './is-triangle-contains-point';
