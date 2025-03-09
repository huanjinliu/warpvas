[**warpvas**](../../../README.md)

***

# Function: calcExpandCoord()

> **calcExpandCoord**(`a`, `b`, `c`, `expandValue`): `object`

Extend point along perpendicular direction from line segment

## Parameters

### a

`Coord`

Target point coordinates {x: number, y: number}

### b

`Coord`

Reference line start point

### c

`Coord`

Reference line end point

### expandValue

`number` = `1`

Extension distance (default: 1 unit)

## Returns

`object`

Extended coordinates

### x

> **x**: `number`

### y

> **y**: `number`

## Example

```typescript
// Basic usage
const expanded = calcExpandCoord(
  {x:0,y:0}, {x:-1,y:1}, {x:1,y:1}
); // Moves 1 unit away from line
```

## Remarks

- Extension direction always perpendicular to line
