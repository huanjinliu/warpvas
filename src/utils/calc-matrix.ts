/**
 * Compute 2D affine transformation matrix from three point pairs
 *
 * @param newCoords - Transformed coordinates triad [Coord, Coord, Coord]
 * @param oldCoords - Original coordinates triad [Coord, Coord, Coord]
 *
 * @returns Matrix parameters [a, b, c, d, e, f] for equation:
 *   X = ax + cy + e
 *   Y = bx + dy + f
 *
 * @example
 * ```typescript
 * // Calculate 45-degree rotation matrix
 * const matrix = calcMatrix(
 *   [{x:0,y:0}, {x:0.707,y:0.707}, {x:-0.707,y:0.707}],
 *   [{x:0,y:0}, {x:1,y:0}, {x:0,y:1}]
 * ); // ≈ [0.707, 0.707, -0.707, 0.707, 0, 0]
 * ```
 *
 * @remarks
 * - Points must be non-collinear in both sets
 * - Input order must correspond between sets
 * - Includes safeFactor adjustment for zero values
 */
export const calcMatrix = (newCoords: [Coord, Coord, Coord], oldCoords: [Coord, Coord, Coord]) => {
  const [_arg_1, _arg_2, _arg_3] = newCoords;
  const [arg_1, arg_2, arg_3] = oldCoords;

  // Apply safe offset to avoid zero values
  const safeFactor =
    0.1 /
    Math.abs(
      [...newCoords, ...oldCoords].reduce((result, item) => Math.min(result, item.x, item.y), -1),
    );

  /**
   * Solver for system of linear equations
   * @param arr1 - 第一组参数，包含 a1, b1, c1, d1
   * @param arr2 - 第二组参数，包含 a2, b2, c2, d2
   * @param arr3 - 第三组参数，包含 a3, b3, c3, d3
   * @returns {{x: number, y: number, z: number}} - 返回解的坐标 (x, y, z)
   */
  const equation = (arr1: number[], arr2: number[], arr3: number[]) => {
    const [a1, b1, c1, d1] = arr1.map(Number);
    const [a2, b2, c2, d2] = arr2.map(Number);
    const [a3, b3, c3, d3] = arr3.map(Number);

    // Intermediate calculations
    const m1 = c1 - (b1 * c2) / b2; // 计算 m1
    const m2 = c2 - (b2 * c3) / b3; // 计算 m2
    const m3 = d2 - (b2 * d3) / b3; // 计算 m3
    const m4 = a2 - (b2 * a3) / b3; // 计算 m4
    const m5 = d1 - (b1 * d2) / b2; // 计算 m5
    const m6 = a1 - (b1 * a2) / b2; // 计算 m6

    const x = ((m1 / m2) * m3 - m5) / ((m1 / m2) * m4 - m6);
    const z = (m3 - m4 * x) / m2;
    const y = (d1 - a1 * x - c1 * z) / b1;

    return { x, y, z }; // 返回解的坐标
  };

  // Solve for X transformation
  const arr1 = [arg_1.x + safeFactor, arg_1.y + safeFactor, 1, _arg_1.x + safeFactor];
  const arr2 = [arg_2.x + safeFactor, arg_2.y + safeFactor, 1, _arg_2.x + safeFactor];
  const arr3 = [arg_3.x + safeFactor, arg_3.y + safeFactor, 1, _arg_3.x + safeFactor];

  const result = equation(arr1, arr2, arr3);

  // Solve for Y transformation
  arr1[3] = _arg_1.y + safeFactor;
  arr2[3] = _arg_2.y + safeFactor;
  arr3[3] = _arg_3.y + safeFactor;

  const result2 = equation(arr1, arr2, arr3);

  const a = result.x;
  const c = result.y;
  const e = result.z;
  const b = result2.x;
  const d = result2.y;
  const f = result2.z;

  return [a, b, c, d, e, f];
};
