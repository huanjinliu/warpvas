### 2. Update Vertex Coordinates

```typescript
// Move the top-left vertex of region (0,0) to (50,50)
const warpvas = new Warpvas(canvas);
warpvas.updateVertexCoord(
    0,                  // row index
    0,                  // column index
    'tl',               // vertex position (top-left)
    { x: 50, y: 50 },   // new position
    true                // recalculate curve
);
```