[**warpvas**](../../../README.md)

***

# Function: calcPerpendicularIntersection()

> **calcPerpendicularIntersection**(`p1`, `p2`, `p0`): `Coord`

Calculate foot of perpendicular from point to line

## Parameters

### p1

`Coord`

Line start point {x: number, y: number}

### p2

`Coord`

Line end point coordinates

### p0

`Coord`

Target point coordinates

## Returns

`Coord`

Foot coordinates on the line

## Example

```typescript
// Vertical line example
const foot = calcPerpendicularIntersection(
  {x:0,y:10}, {x:20,y:10}, {x:5,y:15}
); // {x:5, y:10}
```

## Remarks

- Input points must define a valid line
- Works for infinite lines (not limited to segments)
