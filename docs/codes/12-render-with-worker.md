### 12. Generate Distorted Canvas Asynchronously with Web Worker

```typescript
const canvas = document.createElement('canvas');
const warpvas = new Warpvas(canvas);
await warpvas.renderWithWorker();
```