[**warpvas**](../../../README.md)

***

# Function: calcBoundingBox()

> **calcBoundingBox**(`a`, `b`, `c`): `object`

Calculate minimum bounding box enclosing a triangle

## Parameters

### a

`Coord`

First vertex coordinates {x: number, y: number}

### b

`Coord`

Second vertex coordinates

### c

`Coord`

Third vertex coordinates

## Returns

`object`

Bounding box dimensions {width: number, height: number}

### height

> **height**: `number`

### width

> **width**: `number`

## Example

```typescript
// Equilateral triangle bounding box
calcBoundingBox(
  {x:0,y:0}, {x:100,y:0}, {x:50,y:86.6}
); // {width: 100, height: 86.6}
```

## Remarks

- Dimensions are always non-negative
- Handles floating-point coordinates
