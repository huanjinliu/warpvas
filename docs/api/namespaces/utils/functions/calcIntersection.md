[**warpvas**](../../../README.md)

***

# Function: calcIntersection()

> **calcIntersection**(`p1`, `p2`, `p3`, `p4`): `null` \| `Coord`

Calculate intersection point of two line segments

## Parameters

### p1

`Coord`

Line 1 start point {x: number, y: number}

### p2

`Coord`

Line 1 end point

### p3

`Coord`

Line 2 start point

### p4

`Coord`

Line 2 end point

## Returns

`null` \| `Coord`

Intersection coordinates or null for parallel lines

## Example

```typescript
// Intersecting lines
calcIntersection({x:0,y:0}, {x:2,y:2}, {x:0,y:2}, {x:2,y:0}); // {x:1,y:1}

// Parallel lines
calcIntersection({x:0,y:0}, {x:1,y:1}, {x:0,y:1}, {x:1,y:2}); // null
```

## Remarks

- Handles vertical/horizontal edge cases
- Uses 1e4 scaling factor for floating-point precision
- 0.1**12 parallel threshold
