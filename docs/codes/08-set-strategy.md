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