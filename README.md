# Warpvas

[English](README.md) | [中文](README.cn.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Introduction

> Warpvas is inspired by the combination of "warped" and "canvas", meaning a distorted canvas.

This JavaScript library helps you efficiently implement 3D-like image distortion effects on `Canvas 2D`. Using specific strategies, you can achieve various effects such as perspective, convex/concave lens effects.

## Installation

```shell
npm install warpvas
# or
pnpm add warpvas
```

## Features

- **Grid Split Strategy**: Supports custom grid splitting algorithms to achieve perspective/wave/curved surface distortion effects through different strategies.
- **Boundary Curve Control**: Fine-tune boundary distortion effects through Bezier curve control points.
- **Auxiliary Display Effects**: Provides options to add split lines and split points on the distorted image to assist in observing the distortion effects.
- **Input/Output Limitations**: Provides options to control the input and output dimensions of distorted images for better quality and efficiency control, also preventing performance issues from oversized images.
- **Multiple Rendering Engines**: Switch freely between WebGL (high performance) and Canvas2D (high compatibility) rendering modes.
- **Safe Rendering Mode**: Automatically falls back to Canvas2D rendering when WebGL rendering fails, ensuring basic functionality.
- **State Serialization**: Supports serializing distortion states to base64 strings for easy saving/restoring of complex distortion states.

## Usage

### 1. Create a New Warpvas Instance

```typescript
// Create using an image
const img = new Image();
img.src = 'example.jpg';
img.onload = () => new Warpvas(img);

// Create using canvas with a 2x2 grid
const canvas = document.createElement('canvas');
const warpvas = new Warpvas(canvas, 2, 2);
```

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

### 5. Remove a Specific Distortion Region

```typescript
// Remove the region at row 1, column 1
const warpvas = new Warpvas(canvas);
warpvas.removeRegion({
    row: 1,
    column: 1
});
```

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
    gridColor: { r: 206, g: 102, b: 91, a: 1 } // Use coral red grid
});
```

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

### 8. Set Grid Split Point Calculation Strategy

```typescript
const warpvas = new Warpvas(canvas);

// Use custom strategy
warpvas.setSplitStrategy({
    name: 'custom',
    execute: (warpvas) => {
        // Return custom grid point calculation result
        // return [[[{ x: 0, y: 0 }]]];

        // Use default strategy calculation result
        return Warpvas.strategy();
    }
});
```

### 9. Set Input Canvas Size Limit

```typescript
const warpvas = new Warpvas(canvas);

// Limit input height to 100px, width scales proportionally
warpvas.setInputLimitSize({
    height: 100
});
```

### 10. Set Output Canvas Size Limit

```typescript
const warpvas = new Warpvas(canvas);

// Limit output height to 100px, width scales proportionally
warpvas.setOutputLimitSize({
    height: 100
});
```

### 11. Set Rendering Engine Type

```typescript
const warpvas = new Warpvas(canvas);

// Enable Canvas2D rendering
warpvas.setRenderingContext('2d');

// Enable WebGL rendering
warpvas.setRenderingContext('webgl');
```

### 12. Generate Distorted Canvas Asynchronously with Web Worker

```typescript
const canvas = document.createElement('canvas');
const warpvas = new Warpvas(canvas);
await warpvas.renderWithWorker();
```

Check out the project's [online demo](https://huanjinliu.github.io/warpvas/) or directly view the [project API documentation](docs/api/README.md).

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Contact

huanjinliu - [huanjin.liu@foxmail.com](mailto:huanjin.liu@foxmail.com)