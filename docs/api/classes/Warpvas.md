[**warpvas**](../README.md)

***

# Class: Warpvas

Warp deformation class

The warp deformation class can create corresponding deformation tool instances based on image sources,
and can apply deformation to images through internal methods to produce deformed graphic canvases.

## Example

```ts
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
if (!ctx) return;
// Draw a rectangle
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Create a Warpvas instance, passing the canvas as the image source
const warpvas = new Warpvas(canvas);

// Drag the top-left corner of the original canvas image to position (50, 50)
warpvas.updateVertexCoord(0, 0, 'tl', { x: 50, y: 50 });

// Generate the deformed canvas and add it to the document
const warpvasCanvas = warpvas.render();
document.body.appendChild(warpvasCanvas);
```

## Constructors

### new Warpvas()

> **new Warpvas**(`source`, `rows`, `columns`): [`Warpvas`](Warpvas.md)

Warpvas constructor

Creates a new warp deformation canvas instance. Accepts an image or canvas as source,
with optional initial grid division settings.

#### Parameters

##### source

Image source (HTMLImageElement or HTMLCanvasElement)
               - For images: auto-creates canvas and draws image
               - For canvases: uses directly as source

`HTMLCanvasElement` | `HTMLImageElement`

##### rows

`number` = `1`

Initial horizontal divisions
             - Must be integer ≥ 1
             - 1 = no horizontal division
             - 2 = adds midline horizontal division
             - Default: 1

##### columns

`number` = `1`

Initial vertical divisions
               - Must be integer ≥ 1
               - 1 = no vertical division
               - 2 = adds midline vertical division
               - Default: 1

#### Returns

[`Warpvas`](Warpvas.md)

#### Example

```ts
// Create with image
const img = new Image();
img.src = 'example.jpg';
img.onload = () => new Warpvas(img);

// Create with canvas and 2x2 grid
const canvas = document.createElement('canvas');
new Warpvas(canvas, 2, 2);
```

## Properties

### originalRegionPoints

> **originalRegionPoints**: `Coord`[][][] = `[]`

Original grid points

3D array storing the coordinates of grid points within each region before deformation.
These coordinates are in their original state and used as mapping data for subsequent deformation calculations.

#### Remarks

Array structure: [region row][region column][list of grid points]

***

### originalRegions

> **originalRegions**: `Region`[][] = `[]`

Pre-deformation regions

2D array storing the four vertex coordinates of each rectangular region before deformation.

#### Remarks

Array structure: [region row][region column], each region contains four vertices:
top-left (tl), top-right (tr), bottom-left (bl), bottom-right (br)

#### Example

```ts
// Access top-left coordinate of the first region
const topLeft = warpvas.originalRegions[0][0].tl;
```

***

### regionBoundaryCurves

> **regionBoundaryCurves**: `Record`\<`Direction`, `Bezier`\>[][] = `[]`

Region boundary curves

Stores the Bezier curve objects for the four edges of each region.

***

### regionCurves

> **regionCurves**: `object`[][] = `[]`

Deformed grid curves

Stores the grid lines of each region after deformation, including both vertical and horizontal Bezier curves.
These curves determine the final deformation effect of the image.

#### Remarks

To perform deformation, do not directly manipulate this list.
Instead, use the updateRegionBoundCoords method to adjust specific curves for boundary deformation effects.

#### See

updateRegionBoundCoords Learn how to adjust region boundary curves to achieve deformation effects

***

### regionPoints

> **regionPoints**: `Coord`[][][] = `[]`

Deformed grid points

Stores the coordinates of grid points after deformation. The positions of these points are calculated by the split strategy,
and different strategies will produce different deformation effects.

#### Remarks

To perform deformation, do not directly manipulate this list.
Instead, use the updateVertexCoord/updateRegionBoundCoords methods to achieve deformation effects.

#### See

 - Strategy Learn more about split strategies
 - updateVertexCoord Learn how to adjust region vertex coordinates for deformation
 - updateRegionBoundCoords Learn how to adjust region boundary curves for deformation

***

### renderingConfig

> **renderingConfig**: `RenderingConfig`

Rendering options
Controls various parameters of the rendering process, including padding, anti-aliasing, debug grid display, etc.
These options can be dynamically modified through the setRenderingConfig method.

#### See

 - RenderingConfig View all available rendering options
 - setRenderingConfig Learn how to configure rendering options

***

### renderingContext

> **renderingContext**: `"2d"` \| `"webgl"` = `'webgl'`

Rendering engine type

Specifies the rendering method to use, supports '2d' or 'webgl'.
WebGL mode has better performance, and when safe rendering configuration is set,
it will automatically fallback to Canvas in environments where WebGL is not supported.

#### Default

```ts
'webgl'
```

#### See

setRenderingContext Learn how to switch rendering engines

***

### source

> **source**: `HTMLCanvasElement`

Source canvas object

Stores the canvas containing the original image data. If an HTMLImageElement instance is passed to the constructor,
a new canvas will be automatically created and the image will be drawn onto it to avoid modifying the original image.

***

### splitPoints

> **splitPoints**: `Coord`[] = `[]`

List of relative positions of split points

Stores the relative coordinates (range 0-1) of canvas split points. These points divide the canvas into multiple deformable regions,
where each split point's coordinates are proportional values relative to the canvas dimensions, not actual pixel values.

#### Remarks

To add split points, do not directly manipulate this list. Instead, use the splitRegionByPoint method to add split points.

#### See

splitRegionByPoint Learn how to add split points to achieve region segmentation

***

### splitStrategy

> **splitStrategy**: `Strategy`

Split point calculation strategy

Defines how to calculate the grid point positions inside the deformation region.
The built-in warp strategy is used by default, and you can also set a custom strategy through the setSplitStrategy method.

#### See

setSplitStrategy Learn how to configure the split calculation strategy

***

### splitUnit

> **splitUnit**: `number` = `0.05`

Grid split ratio

Controls the density of the grid split, with a value range of 0-1. The smaller the value,
the denser the grid, resulting in finer deformation effects, but also increasing computation.
For example, when the value is 0.1, the maximum size of each grid is 10% of the image width.

#### Default

```ts
0.05 Default value, meaning the maximum size of each grid is 5% of the image width.
```

#### See

setSplitUnit Learn how to control the grid split ratio

## Accessors

### maxSplitUnitPixel

#### Get Signature

> **get** **maxSplitUnitPixel**(): `number`

Maximum split unit in pixels

Calculates the maximum grid division size allowed for current texture in pixels.
This value is determined by splitUnit (division ratio) and image width.

##### Example

```ts
// Assuming image width is 1000px with splitUnit 0.1
const maxSize = warpvas.maxSplitUnitPixel; // Returns 100px
```

##### See

splitUnit See split ratio configuration

##### Returns

`number`

Maximum split unit in pixels
                  - When splitUnit is 0.1: returns 10% of image width
                  - When splitUnit is 0.05: returns 5% of image width

***

### scale

#### Get Signature

> **get** **scale**(): `object`

Actual scaling ratio of the canvas

Returns the scaling ratio relative to original dimensions.
The ratio combines both input and output limitations:
- Input limitations: Automatic scaling when processing large images
- Output limitations: Prevents oversized canvas generation

##### Example

```ts
const { x, y } = warpvas.scale;
console.log(`Canvas scaled to ${x * 100}% of original size`);
```

##### Returns

`object`

Scaling ratios in x/y dimensions
                                    - 1 = original size
                                    - <1 = downscaled
                                    - x/y always equal to prevent distortion

###### x

> **x**: `number`

###### y

> **y**: `number`

## Methods

### dispose()

> **dispose**(): `void`

Dispose of Warpvas instance

Clean up cached resources and references to free memory

#### Returns

`void`

***

### forEachRegionBoundCoords()

> **forEachRegionBoundCoords**(`callback`): `Record`\<`Direction`, `Coord`[]\>[][]

Retrieve boundary curve control points for all regions

Exports Bezier curve control point data for all deformation regions' boundaries.
The returned data structure maintains full grid topology information for:
1. Serializing/deserializing warp states
2. Implementing undo/redo functionality
3. Cross-instance deformation synchronization

#### Parameters

##### callback

(`rowIndex`, `colIndex`, `direction`, `bezier`) => `Coord`[]

Custom data processor (optional)
                - rowIndex: Region's row index
                - colIndex: Region's column index
                - direction: Boundary direction ('top'|'right'|'bottom'|'left')
                - bezier: Bezier curve object containing control points
                - Default returns raw control point array

#### Returns

`Record`\<`Direction`, `Coord`[]\>[][]

Three-dimensional array containing:
        - 1st dimension: Row indices
        - 2nd dimension: Column indices
        - 3rd dimension: Control points for four boundaries
          - top: Top boundary points [start, cp1, cp2, end]
          - right: Right boundary points
          - bottom: Bottom boundary points
          - left: Left boundary points

#### Example

```ts
// Get all boundary data with normalized coordinates
const normalizedData = warpvas.forEachRegionBoundCoords(
  (row, col, dir, bezier) => bezier.points.map(p => ({
    x: p.x / sourceWidth,
    y: p.y / sourceHeight
  }))
);
```

#### Remarks

Return format specification:
[
  [ // Row 0
    { // Column 0
      top: [{x,y}, {x,y}, {x,y}, {x,y}],    // 4 control points
      right: [{x,y}, {x,y}, {x,y}, {x,y}],  // 4 control points
      bottom: [{x,y}, {x,y}, {x,y}, {x,y}], // 4 control points
      left: [{x,y}, {x,y}, {x,y}, {x,y}]    // 4 control points
    },
    // More columns...
  ],
  // More rows...
]

#### See

updateRegionBoundCoords For modifying boundary curves

***

### forEachSplitRegion()

> **forEachSplitRegion**(`handler`): `void`

Iterate through all quadrilateral cells in deformation grid

Traverses each quadrilateral cell in the warped mesh and provides
their pre/post-deformation vertex information.

#### Parameters

##### handler

(`newVertexs`, `oldVertexs`, `row`, `col`, `rowIndex`, `colIndex`) => `void`

Callback function handling each quadrilateral
               Receives parameters:
               - newVertexs: Deformed vertices [TL, TR, BR, BL]
               - oldVertexs: Original vertices [TL, TR, BR, BL]
               - row: Row index within current region
               - col: Column index within current region
               - rowIndex: Parent region row index
               - colIndex: Parent region column index

#### Returns

`void`

#### Example

```ts
// Iterate through all grid cells and log position info
warpvas.forEachSplitRegion((newVertexs, oldVertexs, row, col, rowIndex, colIndex) => {
  console.log(`Region[${rowIndex},${colIndex}] sub-grid[${row},${col}]:`);
  console.log('Original:', oldVertexs);
  console.log('Deformed:', newVertexs);
});
```

***

### getBoundingBoxInfo()

> **getBoundingBoxInfo**(): `object`

Get bounding box information of warped image

Calculates boundary dimensions and offsets after deformation. The values include
rendering configuration padding and can be used to properly size output canvas.

#### Returns

`object`

Bounding box information object containing:

offsetX - X-axis offset in pixels

offsetY - Y-axis offset in pixels

width - Total width including padding (pixels)

height - Total height including padding (pixels)

##### height

> **height**: `number`

##### offsetX

> **offsetX**: `number`

##### offsetY

> **offsetY**: `number`

##### width

> **width**: `number`

#### Example

```ts
// Get warped image dimensions
const { width, height, offsetX, offsetY } = warpvas.getBoundingBoxInfo();

// Apply dimensions to canvas
canvas.width = width;
canvas.height = height;

// Adjust rendering position
ctx.translate(offsetX, offsetY);
```

***

### getHitInfo()

> **getHitInfo**(`point`): `null` \| \{ `after`: `Coord`[]; `before`: `Coord`[]; `clickPart`: `0` \| `1`; `col`: `number`; `colIndex`: `number`; `row`: `number`; `rowIndex`: `number`; \}

Detect hit position in warped texture

Determines if a coordinate point lies within the deformed texture area
and returns detailed positional metadata. Typical use cases include:
1. Implementing mouse interaction features
2. Validating click positions
3. Retrieving region-specific details

#### Parameters

##### point

`Coord`

Coordinate to test
             - x: X position in pixels
             - y: Y position in pixels

#### Returns

`null` \| \{ `after`: `Coord`[]; `before`: `Coord`[]; `clickPart`: `0` \| `1`; `col`: `number`; `colIndex`: `number`; `row`: `number`; `rowIndex`: `number`; \}

Hit information object containing:
        - rowIndex: Region row index
        - colIndex: Region column index
        - row: Grid row number
        - col: Grid column number
        - before: Original quad vertices [TL, TR, BR, BL]
        - after: Deformed quad vertices [TL, TR, BR, BL]
        - clickPart: Sub-region triangle identifier (0: upper, 1: lower)
        Returns null if point is outside texture

#### Example

```ts
// Detect canvas click position
canvas.addEventListener('click', (e) => {
  const hitInfo = warpvas.getHitInfo({
    x: e.clientX - canvas.offsetLeft,
    y: e.clientY - canvas.offsetTop
  });
});
```

***

### getWarpState()

> **getWarpState**(): `WarpState`

Retrieve complete deformation state data

#### Returns

`WarpState`

Deformation state object containing:
        - splitPoints: Array of split points with normalized coordinates (0-1 range)
        - regionBounds: 3D array of boundary control points for all regions

#### Remarks

Data structure specifications:
- splitPoints: Normalized coordinates relative to original texture dimensions
- regionBounds: Hierarchical array structure [rows][columns][boundaryDirections]
- Each boundary contains exactly 4 control points in order: [p0, pm0, pm1, p1]

#### See

 - setWarpState Apply saved deformation state
 - resetWarpState Restore default grid configuration

***

### isUnwarped()

> **isUnwarped**(): `boolean`

Verify texture deformation status

Determines if the texture is in its original undeformed state by checking:
1. Absence of split points (empty splitPoints array)
2. All boundaries remain linear (no Bezier curve deformation)
3. Boundary positions match original texture edges

#### Returns

`boolean`

- true: Texture is in pristine undeformed state
- false: Texture has deformation or splits

***

### removeRegion()

> **removeRegion**(...`positions`): `void`

Remove specified deformation regions

Deletes one or more deformation regions while maintaining grid continuity
through automatic region merging.

#### Parameters

##### positions

...`object`[]

Array of region positions to remove
                 - Each position contains row and column indices (0-based)

#### Returns

`void`

#### Example

```ts
// Remove region at row 1, column 1
warpvas.removeRegion(
  {
    row: 1,
    column: 1
  }
);
```

#### Remarks

Implementation details:
1. Removal is invalid for:
   - Corner vertices of the image
   - Positions outside valid region bounds
   - Non-existent split points

2. Removal sequence:
   - Merge rows (bottom to top)
   - Merge columns (right to left)
   - Automatically smooth boundary curve transitions

3. Performance considerations:
   - Batch removal of multiple points is recommended over single-point operations

***

### render()

> **render**(): `HTMLCanvasElement`

Render warped canvas

Generates a new canvas or renders deformed image on specified canvas
based on current deformation parameters.

#### Returns

`HTMLCanvasElement`

Newly created or specified canvas element

#### Throws

- [Warpvas Error] When rendering fails without safe mode
- [Warpvas Error] When canvas creation fails

#### Example

```ts
// Render and append to DOM
const canvas = warpvas.render();
document.body.appendChild(canvas);
```

#### Remarks

Performance recommendations:
1. For frequent updates, reuse output canvas with setRenderingCanvas
2. For large image deformation, consider:
   - Switching to WebGL rendering backend
   - Using worker-based async rendering

#### See

 - setRenderingCanvas Configure reusable canvas
 - renderWithWorker Async rendering via Web Worker

***

### renderWithWorker()

> **renderWithWorker**(`caching`): `Promise`\<`HTMLCanvasElement`\>

Generate warped canvas asynchronously via Web Worker

Executes deformation and rendering operations in a separate thread
to prevent blocking the main thread.

#### Parameters

##### caching

`boolean` = `true`

#### Returns

`Promise`\<`HTMLCanvasElement`\>

Promise resolving to rendered warped canvas

#### Throws

- [Warpvas Error] Failed to create Web Worker
- [Warpvas Error] Rendering failed without safe mode
- [Warpvas Error] Canvas creation failed

#### Example

```ts
// Async rendering and awaiting result
try {
  const canvas = await warpvas.renderWithWorker();
  document.body.appendChild(canvas);
} catch (error) {
  console.error('Rendering failed:', error);
}
```

#### See

 - setRenderingConfig Configure rendering options
 - render Synchronous rendering method

***

### resetWarpState()

> **resetWarpState**(`rows`, `columns`): [`Warpvas`](Warpvas.md)

Restore default grid configuration

Resets texture deformation to initial grid state by:
1. Clearing all split points
2. Recreating straight-line boundaries
3. Rebuilding specified grid topology

#### Parameters

##### rows

`number` = `1`

Number of grid rows (default: 1)

##### columns

`number` = `1`

Number of grid columns (default: 1)

#### Returns

[`Warpvas`](Warpvas.md)

Current instance for method chaining

#### Example

```ts
// 1. Reset to default 1x1 grid
warpvas.resetWarpState();

// 2. Reset to 3x2 grid
warpvas.resetWarpState(3, 2);
```

#### See

 - setWarpState Apply custom deformation state
 - getWarpState Retrieve current deformation state

***

### setInputLimitSize()

> **setInputLimitSize**(`limitSize`): [`Warpvas`](Warpvas.md)

Set size constraints for input canvas

Restricts maximum dimensions of input canvas when processing large images.
System will automatically scale images proportionally within constraints to
improve performance and reduce memory consumption.

#### Parameters

##### limitSize

Size constraint configuration object
                   - width?: number - Maximum width in pixels
                   - height?: number - Maximum height in pixels
                   - Pass undefined to remove constraints

`undefined` | \{ `height`: `number`; `width`: `number`; \}

#### Returns

[`Warpvas`](Warpvas.md)

Instance itself for method chaining

#### Example

```ts
// Constrain input to 1000x1000 pixels
warpvas.setInputLimitSize({
  width: 1000,
  height: 1000
});

// Remove size constraints
warpvas.setInputLimitSize(undefined);
```

#### Remarks

Performance recommendations:
1. For large images (>2000px), recommend setting appropriate constraints
2. Images maintain original aspect ratio when scaled
3. Uses cached canvas to avoid repeated scaling operations

***

### setOutputLimitSize()

> **setOutputLimitSize**(`limitSize`): [`Warpvas`](Warpvas.md)

Set size constraints for output canvas

Restricts maximum dimensions of output canvas after deformation. When deformation results
exceed size limits, system automatically scales output proportionally to prevent
rendering failures due to memory constraints.

#### Parameters

##### limitSize

Size constraint configuration object
                   - width?: number - Maximum width in pixels
                   - height?: number - Maximum height in pixels
                   - Pass undefined to remove constraints

`undefined` | \{ `height`: `number`; `width`: `number`; \}

#### Returns

[`Warpvas`](Warpvas.md)

Instance itself for method chaining

#### Example

```ts
// Constrain output to 2000x2000 pixels
warpvas.setOutputLimitSize({
  width: 2000,
  height: 2000
});

// Remove size constraints (may cause large image rendering failures)
warpvas.setOutputLimitSize(undefined);
```

#### Remarks

Performance recommendations:
1. Unconstrained deformation may exceed browser's Canvas size limits, causing blank output
2. Recommend setting appropriate constraints based on application scenarios
3. Output dimensions significantly impact rendering performance and memory usage

***

### setRenderingCanvas()

> **setRenderingCanvas**(`canvas`): [`Warpvas`](Warpvas.md)

Set rendering output canvas

Specifies a fixed canvas for rendering output. Reusing the same canvas across multiple
renders reduces memory allocation from canvas creation and improves performance.

#### Parameters

##### canvas

`HTMLCanvasElement`

Target canvas element

#### Returns

[`Warpvas`](Warpvas.md)

Instance itself for method chaining

#### Example

```ts
// Reuse canvas in animation loop
const canvas = document.createElement('canvas');
warpvas.setRenderingCanvas(canvas);

function animate() {
  // Update content on the same canvas each frame
  warpvas.render();
  requestAnimationFrame(animate);
}
```

#### Remarks

WARNING: Avoid using the same canvas for both input and output, as this forces
creating a temporary canvas copy before each render, significantly degrading performance

***

### setRenderingConfig()

> **setRenderingConfig**(`options`): [`Warpvas`](Warpvas.md)

Set rendering configuration options

Configures various parameters for texture mapping rendering. Allows partial
overriding of default configuration.

#### Parameters

##### options

`Partial`\<`RenderingConfig`\>

Rendering configuration object
               - padding: number - Padding around output (pixels), default 0
               - enableAntialias: boolean - Enable/disable anti-aliasing, default true
               - enableSafeRendering: boolean - Safe rendering mode (WebGL only),
                 auto-fallback to Canvas2D on failure, default true
               - enableContentDisplay: boolean - Show warped content, default true
               - enableGridDisplay: boolean - Show deformation grid, default false
               - enableGridVertexDisplay: boolean - Show grid vertices, default false
               - gridColor: { r: number, g: number, b: number, a: number } -
                 Grid/vertex RGBA color object, default red (255,0,0,1)

#### Returns

[`Warpvas`](Warpvas.md)

Instance itself for method chaining

#### Example

```ts
// Configure rendering parameters
warpvas.setRenderingConfig({
  padding: 10,                            // 10px padding
  enableAntialias: true,                  // Enable anti-aliasing
  enableSafeRendering: true,              // Enable safe mode
  enableContentDisplay: true,             // Display warped content
  enableGridDisplay: true,                // Show deformation grid
  gridColor: { r: 0, g: 255, b: 0, a: 1 } // Green grid color
});
```

#### Remarks

Performance recommendations:
1. Maintain enableSafeRendering=true in production environments
2. Padding helps prevent visual clipping during deformation

***

### setRenderingContext()

> **setRenderingContext**(`ctx`): [`Warpvas`](Warpvas.md)

Set rendering engine type

Configures the rendering engine to use Canvas2D or WebGL mode. Mode comparison:
- Canvas2D: Better compatibility (supports most browsers) but slower performance
- WebGL: Better performance (GPU accelerated) for large images, but limited compatibility

#### Parameters

##### ctx

`"2d"` | `"webgl"`

#### Returns

[`Warpvas`](Warpvas.md)

Returns the instance itself for method chaining

#### Remarks

In safe rendering mode, the system will automatically fall back to Canvas2D
when WebGL is unavailable or rendering fails

#### Example

```ts
// Enable Canvas2D rendering
warpvas.setRenderingContext('2d');

// Enable WebGL rendering
warpvas.setRenderingContext('webgl');
```

***

### setSplitStrategy()

> **setSplitStrategy**(`strategy`): [`Warpvas`](Warpvas.md)

Set calculation strategy for grid subdivision points

Customizes grid subdivision point calculation method. Different strategies enable
various deformation effects through alternative subdivision approaches.

#### Parameters

##### strategy

`Strategy`

Subdivision strategy configuration object
                 - name: Strategy identifier (customizable)
                 - execute: Execution function receiving Warpvas instance

#### Returns

[`Warpvas`](Warpvas.md)

Instance itself for method chaining

#### Example

```ts
// Using custom strategy
warpvas.setSplitStrategy({
  name: 'custom',
  execute: (warpvas) => {
    // Return custom grid points calculation
    return [[[{ x: 0, y: 0 }]]];
  }
});
```

#### See

Warpvas.strategy Default strategy implementation

***

### setSplitUnit()

> **setSplitUnit**(`splitUnit`): [`Warpvas`](Warpvas.md)

Set maximum ratio for deformation grid subdivision

Controls the granularity of grid subdivision. Smaller values produce denser grids
for finer deformation effects, while increasing computational load.

#### Parameters

##### splitUnit

`number`

Maximum subdivision ratio value
                   - Range: Numerical value between 0-1
                   - 0.1: Maximum grid unit equals 10% of image width
                   - 0.05: Maximum grid unit equals 5% of image width
                   - Values ≤0 or >1 will be reset to 1

#### Returns

[`Warpvas`](Warpvas.md)

Instance itself for method chaining

#### Example

```ts
// Set dense grid for finer deformation
warpvas.setSplitUnit(0.05);

// Set sparse grid for better performance
warpvas.setSplitUnit(0.2);
```

***

### setWarpState()

> **setWarpState**(`splitPoints`, `regionBounds`): [`Warpvas`](Warpvas.md)

Apply saved deformation state configuration

Updates texture deformation using provided warp data, supporting:
1. State restoration from serialized data
2. Cross-instance deformation replication
3. Template-based warp applications

#### Parameters

##### splitPoints

`Coord`[]

Array of normalized split points (0-1 range)

##### regionBounds

Boundary curve data (optional)
                 - When provided: Directly sets boundary curves
                 - When null: Generates linear boundaries from split points

`null` | `Record`\<`Direction`, `Coord`[]\>[][]

#### Returns

[`Warpvas`](Warpvas.md)

Current instance for method chaining

#### Example

```ts
// 1. Apply complete warp state
const data = sourceWarpvas.getWarpState();
sourceWarpvas.setWarpState(data.splitPoints, data.regionBounds);

// 2. Reset to non-warped state with central split
warpvas.setWarpState([
  { x: 0.5, y: 0.5 }  // Add central split point
]);
```

#### Remarks

Critical implementation details:
1. Split points must be normalized (0-1 range)
2. Automatic linear boundaries maintain grid continuity
3. Control point order: [p0, pm0, pm1, p1] per boundary

#### See

 - getWarpState Retrieve current deformation state
 - resetWarpState Restore default grid configuration

***

### splitRegionByPoint()

> **splitRegionByPoint**(`rowIndex`, `colIndex`, `point`, `tolerate`): `void`

Add split point to partition region

Inserts a new split point in specified region to create sub-regions.

#### Parameters

##### rowIndex

`number`

Target region row index (0-based)

##### colIndex

`number`

Target region column index (0-based)

##### point

`Coord`

Split point coordinates in pixels
             - x: Horizontal position
             - y: Vertical position

##### tolerate

`number` = `0.05`

Tolerance threshold for boundary snapping (default: 0.05)
               - Range: 0-1 (normalized)
               - Points near boundaries within tolerance will snap to edges
               - Higher values prevent tiny sub-regions near boundaries

#### Returns

`void`

#### Example

```ts
// Split center of first region (0,0) with 10% tolerance
const region = warpvas.originalRegions[0][0];
warpvas.splitRegionByPoint(
  0,    // rowIndex
  0,    // colIndex
  {     // Region center
    x: (region.tl.x + region.br.x) / 2,
    y: (region.tl.y + region.br.y) / 2
  },
  0.1   // 10% tolerance
);
```

#### Remarks

Implementation notes:
1. Split points modify adjacent region boundaries using Bezier curve blending
2. Complex deformations may require recalculating neighboring regions
3. Excessive split points may impact performance

#### See

removeRegion Remove split points and merge regions

***

### updateRegionBoundCoords()

> **updateRegionBoundCoords**(`rowIndex`, `colIndex`, `direction`, `coords`): [`Warpvas`](Warpvas.md)

Update boundary curve coordinates for specified direction

Modifies Bezier curve shape of region boundary by setting new control points,
allowing curvature adjustments while maintaining grid continuity.

#### Parameters

##### rowIndex

`number`

Target region's row index (0-based)

##### colIndex

`number`

Target region's column index (0-based)

##### direction

Boundary direction to update
                - 'top': Top boundary
                - 'right': Right boundary
                - 'bottom': Bottom boundary
                - 'left': Left boundary

`"top"` | `"bottom"` | `"left"` | `"right"`

##### coords

\[`Coord`, `Coord`, `Coord`, `Coord`\]

Bezier curve control points array containing:
              - p0: Start point coordinates
              - pm0: First control point coordinates
              - pm1: Second control point coordinates
              - p1: End point coordinates

#### Returns

[`Warpvas`](Warpvas.md)

Current instance for method chaining

#### Example

```ts
// Create S-shaped top boundary curve
warpvas.updateRegionBoundCoords(
  0,                    // rowIndex
  0,                    // colIndex
  'top',                // direction
  [
    { x: 0, y: 0 },    // Start point
    { x: 30, y: 20 },  // Control point 1
    { x: 70, y: -20 }, // Control point 2
    { x: 100, y: 0 }   // End point
  ]
);
```

#### See

updateVertexCoord For updating individual vertices

***

### updateVertexCoord()

> **updateVertexCoord**(`rowIndex`, `colIndex`, `vertexPosition`, `coord`, `redistribute`): [`Warpvas`](Warpvas.md)

Update coordinates for a warped texture vertex

Moves specified vertex and automatically synchronizes all connected vertices
to maintain grid continuity across deformation regions.

#### Parameters

##### rowIndex

`number`

Target region's row index (0-based)

##### colIndex

`number`

Target region's column index (0-based)

##### vertexPosition

Vertex position type
                      - 'tl': Top-left
                      - 'tr': Top-right
                      - 'bl': Bottom-left
                      - 'br': Bottom-right

`"br"` | `"tr"` | `"tl"` | `"bl"`

##### coord

`Coord`

New vertex coordinates { x, y }

##### redistribute

`boolean` = `true`

Control point recalculation flag
                    - true: Recalculate for smooth transition (default)
                    - false: Preserve existing curve shape

#### Returns

[`Warpvas`](Warpvas.md)

Current instance for method chaining

#### Example

```ts
// Move top-left vertex of region (0,0) to (100,100)
warpvas.updateVertexCoord(
  0,                    // rowIndex
  0,                    // colIndex
  'tl',                 // vertexPosition
  { x: 100, y: 100 },   // New position
  true                  // Recalculate curves
);
```

#### Remarks

Important considerations:
1. Vertex movement affects all connected vertices and curves
2. Setting redistribute=false preserves original curvature
3. Invalid indices will be silently ignored

***

### deserializeWarpState()

> `static` **deserializeWarpState**(`base64String`): `WarpState`

Deserialize compressed warp state

Restores warp deformation data from base64 string generated by serializeWarpState.
The decompressed data can directly rebuild the texture's deformation state.

#### Parameters

##### base64String

`string`

base64 encoded string from serializeWarpState

#### Returns

`WarpState`

Decompressed warp state containing:
                  - splitPoints: Array of split coordinates (0-1 range)
                  - boundData: 2D array of boundary deformation data per region

#### Example

```ts
// 1. Deserialize data
const { splitPoints, boundData } = Warpvas.deserializeWarpState(compressedData);

// 2. Apply deformation state
warpvas.setWarpState(splitPoints, boundData);
```

#### See

 - serializeWarpState Compress warp state
 - setWarpState Apply deformation configuration

***

### serializeWarpState()

> `static` **serializeWarpState**(`warpState`): `string`

Serialize warp state data

Compresses warp deformation data into base64 string format for transmission/storage.
The compressed data includes:
- Split points configuration
- Region boundary deformations

#### Parameters

##### warpState

`WarpState`

Warp state object containing:
                  - splitPoints: Grid division coordinates
                  - regionBounds: Boundary deformation data

#### Returns

`string`

base64 encoded string representing compressed warp state

#### Example

```ts
// 1. Get current warp state
const warpState = warpvas.getWarpState();

// 2. Serialize data
const compressed = Warpvas.serializeWarpState(warpState);
```

#### See

 - deserializeWarpState Restore compressed warp state
 - getWarpState Retrieve current deformation data

***

### strategy()

> `static` **strategy**(`warpvas`): `Coord`[][][]

Built-in default warp splitting strategy

Default grid splitting strategy that generates grid points by calculating
midpoints between intersections of horizontal/vertical Bezier curves.
This strategy effectively demonstrates planar warp effects, particularly
suitable for:
- Image bending deformation
- Perspective transformation
- Wave effect simulations

#### Parameters

##### warpvas

[`Warpvas`](Warpvas.md)

Current warp canvas instance

#### Returns

`Coord`[][][]

3D array containing grid coordinates of all split regions
         - 1st dimension: Region row index
         - 2nd dimension: Region column index
         - 3rd dimension: List of grid points in the region

#### Example

```ts
// Default strategy is already applied, but can be explicitly set:
warpvas.setSplitStrategy({
  name: 'default',
  execute: Warpvas.strategy
});
```

#### Remarks

Strategy workflow:
1. Iterate through each split region
2. Calculate intersections of horizontal/vertical Bezier curves within region
3. Use midpoints of intersecting pairs as grid points
4. Ensures uniform grid distribution that follows curve deformations
