[**warpvas**](../../../README.md)

***

# Function: calcRelativeCoord()

> **calcRelativeCoord**(`p0`, `p1`, `value`): `Coord`

Calculate coordinates along a line at specified distance

## Parameters

### p0

`Coord`

Start point coordinates {x: number, y: number}

### p1

`Coord`

Direction reference point coordinates

### value

`number`

Distance to move (positive: towards p1, negative: opposite)

## Returns

`Coord`

New coordinates along the line segment

## Example

```typescript
// Horizontal movement
const start = { x: 0, y: 0 };
const end = { x: 10, y: 0 };
console.log(calcRelativeCoord(start, end, 5)); // {x:5, y:0}

// Diagonal movement
console.log(calcRelativeCoord(start, {x:3,y:4}, 5)); // {x:3, y:4}
```

## Remarks

- Returns p0 when points coincide
- Handles vertical/horizontal/sloped lines
- Subject to JS floating-point precision
