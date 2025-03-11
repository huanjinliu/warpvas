### 10. Set Output Canvas Size Limit

Limit the maximum size of the distorted output canvas. When
distortion results in an oversized canvas, the system will
automatically scale the result proportionally within limits to
prevent rendering failures due to memory constraints.

```typescript
const warpvas = new Warpvas(canvas);

// Limit output height to 100px, width scales proportionally
warpvas.setOutputLimitSize({ height: 100 });
```