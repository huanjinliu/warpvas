### 9. Set Input Canvas Size Limit

When processing large images, you can use this method to limit the
maximum size of the input canvas. The system will automatically
scale the image proportionally within the limits to improve
performance and reduce memory usage.

```typescript
const warpvas = new Warpvas(canvas);

// Limit input height to 100px, width scales proportionally
warpvas.setInputLimitSize({ height: 100 });
```