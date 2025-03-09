[**warpvas**](../../../README.md)

***

# Function: isTriangleContainsPoint()

> **isTriangleContainsPoint**(`p`, `a`, `b`, `c`, `tolerate`): `boolean`

Determines if a point is inside/on a triangle using area comparison method

## Parameters

### p

`Coord`

Target point coordinates {x: number, y: number}

### a

`Coord`

Triangle vertex A coordinates

### b

`Coord`

Triangle vertex B coordinates

### c

`Coord`

Triangle vertex C coordinates

### tolerate

`number` = `0.1`

Tolerance for floating-point precision (default: 0.1)

## Returns

`boolean`

True if point is inside or on triangle edges

## Example

```typescript
// Check point in equilateral triangle
const a = { x: 0, y: 0 };
const b = { x: 1, y: 0 };
const c = { x: 0.5, y: 0.866 };

console.log(isTriangleContainsPoint({x: 0.5, y: 0.289}, a, b, c)); // true
console.log(isTriangleContainsPoint({x: 2, y: 2}, a, b, c)); // false
```

## Remarks

- Uses determinant for area calculation
- Edge points are considered inside
- Vertex order insensitive
