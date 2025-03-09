### 6. Warpvas Rendering Configuration Options

```typescript
// Control rendering effects and debug view display
const warpvas = new Warpvas(canvas);
warpvas.setRenderingConfig({
    // padding: 10,                // Set 10px padding
    // enableAntialias: true,      // Enable anti-aliasing
    // enableSafeRendering: true,  // Enable safe rendering mode
    // enableContentDisplay: true,  // Show distorted content
    enableGridDisplay: true,       // Show distortion grid
    enableGridVertexDisplay: true, // Show grid vertices
    gridColor: { r: 255, g: 99, b: 71, a: 1 } // Use coral red grid
});
```