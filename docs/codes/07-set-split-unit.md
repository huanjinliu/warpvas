### 7. Set Maximum Grid Subdivision Ratio

```typescript
// Set sparse grid to improve performance
const warpvas = new Warpvas(canvas);
warpvas
    .setSplitUnit(0.2)
    .setRenderingConfig({
        enableGridDisplay: true,
        gridColor: { r: 206, g: 102, b: 91, a: 1 }
    });
```