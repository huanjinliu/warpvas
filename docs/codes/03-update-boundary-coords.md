### 3. Update Boundary Curve Coordinates

```typescript
// Create an arc-shaped bottom boundary
const warpvas = new Warpvas(canvas);
warpvas.updateRegionBoundCoords(
    0,                  // row index
    0,                  // column index
    'bottom',           // direction
    [
        { x: 0, y: canvas.height },                          // start point
        { x: canvas.width / 3, y: canvas.height / 2 },        // control point 1
        { x: (canvas.width / 3) * 2, y: canvas.height / 2 },  // control point 2
        { x: canvas.width, y: canvas.height },                // end point
    ]
);
```