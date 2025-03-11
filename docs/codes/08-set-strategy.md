### 8. Set Grid Split Point Calculation Strategy

To apply perspective mode, you need to install the warpvas-perspective package separately.

```typescript
import WarpvasPerspective from 'warpvas-perspective';

const warpvas = new Warpvas(canvas);
warpvas.setSplitStrategy({
    name: 'custom',
    execute: (warpvas) => {
        // Use default strategy calculation result
        // return Warpvas.strategy(warpvas);

        // Use perspective strategy calculation result
        return WarpvasPerspective.strategy(warpvas);
    }
});
```