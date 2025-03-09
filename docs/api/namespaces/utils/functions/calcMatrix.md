[**warpvas**](../../../README.md)

***

# Function: calcMatrix()

> **calcMatrix**(`newCoords`, `oldCoords`): `number`[]

Compute 2D affine transformation matrix from three point pairs

## Parameters

### newCoords

\[`Coord`, `Coord`, `Coord`\]

Transformed coordinates triad [Coord, Coord, Coord]

### oldCoords

\[`Coord`, `Coord`, `Coord`\]

Original coordinates triad [Coord, Coord, Coord]

## Returns

`number`[]

Matrix parameters [a, b, c, d, e, f] for equation:
  X = ax + cy + e
  Y = bx + dy + f

## Example

```typescript
// Calculate 45-degree rotation matrix
const matrix = calcMatrix(
  [{x:0,y:0}, {x:0.707,y:0.707}, {x:-0.707,y:0.707}],
  [{x:0,y:0}, {x:1,y:0}, {x:0,y:1}]
); // ≈ [0.707, 0.707, -0.707, 0.707, 0, 0]
```

## Remarks

- Points must be non-collinear in both sets
- Input order must correspond between sets
- Includes safeFactor adjustment for zero values
