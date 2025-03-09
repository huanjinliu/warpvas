# Warpvas

[English](README.md) | [中文](README.cn.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 项目介绍

> Warpvas的起名灵感源于 warped + canvas，扭曲的画布。

这个JavaScript库帮助你在`Canvas 2D`上高效实现类似3D的图像扭曲变形效果，使用特定的策略可以实现不同的效果，如透视、凹凸镜等效果。

## 安装方法

```shell
npm install warpvas
# or
pnpm add warpvas
```

## 工具特性

- **网格分割策略**：支持自定义网格分割算法，通过不同策略实现透视/波浪/曲面等变形效果。
- **边界曲线控制**：通过贝塞尔曲线控制点调整，实现精细的边界变形效果控制。
- **辅助显示效果**：提供选项以在变形图像上添加分隔线和分割点等辅助显示效果，以协助观察图像变形效果。
- **输入输出限制**：提供选项以控制变形图像的输入和输出尺寸，更好把控变形图像的生成质量和效率，也可防止超大图像导致性能问题。
- **多渲染引擎支持**：可在 WebGL (高性能) 和 Canvas2D (高兼容) 渲染模式间自由切换。
- **安全渲染模式**：WebGL 渲染失败时自动降级至 Canvas2D 渲染，保障基础功能可用性。
- **状态序列化**：支持将变形状态序列化为 base64 字符串，便于保存/恢复复杂变形状态。


## 使用方式

### 1. 创建新的变形画布实例

```typescript
// 使用图片创建
const img = new Image();
img.src = 'example.jpg';
img.onload = () => new Warpvas(img);

// 使用画布创建并设置2x2网格
const canvas = document.createElement('canvas');
const warpvas = new Warpvas(canvas, 2, 2);
```

### 2. 更新变形顶点坐标

```typescript
// 将区域(0,0)的左上角顶点移动到(50,50)
const warpvas = new Warpvas(canvas);
warpvas.updateVertexCoord(
    0,                  // 行索引
    0,                  // 列索引
    'tl',               // 顶点位置(左上角)
    { x: 50, y: 50 },   // 新位置
    true                // 重新计算曲线
);
```

### 3. 更新指定方向的边界曲线坐标

```typescript
// 创建一个弧形的底部边界
const warpvas = new Warpvas(canvas);
warpvas.updateRegionBoundCoords(
    0,                  // 行索引
    0,                  // 列索引
    'bottom',           // 方向
    [
        { x: 0, y: canvas.height },                          // 起始点
        { x: canvas.width / 3, y: canvas.height / 2 },        // 控制点1
        { x: (canvas.width / 3) * 2, y: canvas.height / 2 },  // 控制点2
        { x: canvas.width, y: canvas.height },                // 终点
    ]
);
```

### 4. 添加分割点以划分区域

```typescript
// 在第一个区域(0,0)的中心添加分割点，容差为10%
const warpvas = new Warpvas(canvas);
const region = warpvas.originalRegions[0][0];

warpvas.splitRegionByPoint(
    0,      // 行索引
    0,      // 列索引
    {
        x: (region.tl.x + region.br.x) / 2,  // 区域中心X坐标
        y: (region.tl.y + region.br.y) / 2,   // 区域中心Y坐标
    },
    0.1     // 10%容差
);
```

### 5. 移除指定的变形区域

```typescript
// 移除位于第1行第1列的区域
const warpvas = new Warpvas(canvas);
warpvas.removeRegion({
    row: 1,
    column: 1
});
```

### 6. Warpvas渲染配置选项

```typescript
// 控制渲染效果和调试视图显示
const warpvas = new Warpvas(canvas);
warpvas.setRenderingConfig({
    // padding: 10,                // 设置10px内边距
    // enableAntialias: true,      // 启用抗锯齿
    // enableSafeRendering: true,  // 启用安全渲染模式
    // enableContentDisplay: true,  // 显示变形内容
    enableGridDisplay: true,       // 显示变形网格
    enableGridVertexDisplay: true, // 显示网格顶点
    gridColor: { r: 255, g: 99, b: 71, a: 1 } // 使用珊瑚红色网格
});
```

### 7. 设置变形网格细分的最大比例

```typescript
// 设置稀疏网格以提高性能
const warpvas = new Warpvas(canvas);
warpvas
    .setSplitUnit(0.2)
    .setRenderingConfig({
        enableGridDisplay: true,
        gridColor: { r: 206, g: 102, b: 91, a: 1 }
    });
```

### 8. 设置网格细分点的计算策略

```typescript
const warpvas = new Warpvas(canvas);

// 使用自定义策略
warpvas.setSplitStrategy({
    name: 'custom',
    execute: (warpvas) => {
        // 返回自定义网格点计算结果
        // return [[[{ x: 0, y: 0 }]]];

        // 使用默认策略计算的结果
        return Warpvas.strategy(warpvas);
    }
});
```

### 9. 设置输入画布的尺寸限制

```typescript
const warpvas = new Warpvas(canvas);

// 限制输入高度为100px，宽度按比例缩放
warpvas.setInputLimitSize({
    height: 100
});
```

### 10. 设置输出画布的尺寸限制

```typescript
const warpvas = new Warpvas(canvas);

// 限制输出高度为100px，宽度按比例缩放
warpvas.setOutputLimitSize({
    height: 100
});
```

### 11. 设置渲染引擎类型

```typescript
const warpvas = new Warpvas(canvas);

// 启用Canvas2D渲染
warpvas.setRenderingContext('2d');

// 启用WebGL渲染
warpvas.setRenderingContext('webgl');
```

### 12. 通过Web Worker异步生成变形画布

```typescript
const canvas = document.createElement('canvas');
const warpvas = new Warpvas(canvas);
await warpvas.renderWithWorker();
```

查看项目的[在线示例](https://huanjinliu.github.io/warpvas/)，或直接查阅[项目API文档](docs/api/README.md)。

### 许可证

此项目使用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

### 联系方式

huanjinliu - [huanjin.liu@foxmail.com](mailto:huanjin.liu@foxmail.com)