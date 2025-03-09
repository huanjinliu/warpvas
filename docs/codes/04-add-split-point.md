### 4. Add Split Points to Divide Regions

```typescript
// Add a split point at the center of the first region (0,0) with 10% tolerance
const warpvas = new Warpvas(canvas);
const region = warpvas.originalRegions[0][0];

warpvas.splitRegionByPoint(
    0,      // row index
    0,      // column index
    {
        x: (region.tl.x + region.br.x) / 2,  // region center X coordinate
        y: (region.tl.y + region.br.y) / 2,   // region center Y coordinate
    },
    0.1     // 10% tolerance
);
```