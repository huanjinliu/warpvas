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