import { Bezier } from 'bezier-js';
import createWarpedCanvas2D from './renders/canvas2d';
import createWarpedCanvasWebGL from './renders/webgl';
import createWorkerWarpedCanvas2D from './renders/worker-canvas2d';
import createWorkerWarpedCanvasWebGL from './renders/worker-webgl';
import { isTriangleContainsPoint } from '@utils';

/**
 * Vertex position enum for warp region
 *
 * Used to identify the four vertex coordinates of the warp region.
 *
 * @enum {string}
 */
export enum VertexPosition {
  /** Top left vertex */
  TOP_LEFT = 'tl',
  /** Top right vertex */
  TOP_RIGHT = 'tr',
  /** Bottom left vertex */
  BOTTOM_LEFT = 'bl',
  /** Bottom right vertex */
  BOTTOM_RIGHT = 'br',
}

/**
 * Warp region boundary direction enum
 *
 * Used to identify the four boundary directions of the warp region.
 *
 * @enum {string}
 */
export enum Direction {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Warp region type
 *
 * An object type that describes a rectangular warp region, containing coordinate information of the four vertices.
 *
 * @example
 * const region: Region = {
 *   tl: { x: 0, y: 0 },    // Top-left coordinates
 *   tr: { x: 100, y: 0 },  // Top-right coordinates
 *   bl: { x: 0, y: 100 },  // Bottom-left coordinates
 *   br: { x: 100, y: 100 } // Bottom-right coordinates
 * };
 */
export type Region = Record<VertexPosition, Coord>;

/**
 * Split point calculation strategy interface type
 *
 * Defines the strategy name and calculation method for grid split points,
 * which determines how to generate grid split points inside the warp region,
 * affecting the final warp effect.
 *
 * @property {string} name - Custom identifier name of the strategy
 * @property {Function} execute - Method to calculate split points under the warp strategy
 * @property {Warpvas} execute.warpvas - Current warpvas instance object
 * @property {Coord[][][]} execute.return - Returns a 3D array representing the grid point coordinates of each split region
 *                                          [region row][region column][grid point coordinates]
 */
export type Strategy = {
  name: string;
  execute: (warpvas: Warpvas) => Coord[][][];
};

/**
 * Warpvas rendering configuration options
 *
 * Controls the rendering effects and debug view display of the warpvas.
 * By configuring these options, you can customize the appearance and performance of the warpvas.
 *
 * @example
 * const warpvas = new Warpvas(canvas);
 * warpvas.setRenderingConfig({
 *   padding: 10,                            // Set 10px padding
 *   enableAntialias: true,                  // Enable anti-aliasing
 *   enableSafeRendering: true,              // Enable safe rendering mode
 *   enableContentDisplay: true,             // Display the warped content
 *   enableGridDisplay: true,                // Display the warp grid
 *   enableGridVertexDisplay: false,         // Display grid vertices
 *   gridColor: { r: 0, g: 255, b: 0, a: 1 } // Use coral red grid
 * });
 */
export interface RenderingConfig {
  /**
   * Padding around the warpvas (in pixels)
   *
   * Often used to provide some padding area to preserve overflowed warp content
   * @default 0
   */
  padding: number;

  /**
   * Whether to enable anti-aliasing
   *
   * When enabled, it makes image edges smoother, but may slightly affect performance.
   * The effect varies across different rendering modes.
   * @default true
   */
  enableAntialias: boolean;

  /**
   * Whether to enable safe rendering mode
   *
   * When enabled, it will automatically fallback to Canvas 2D rendering if WebGL rendering fails,
   * preventing the warpvas from not being displayed due to errors.
   * @default true
   * @remarks Since WebGL rendering is used by default, it's recommended to keep this enabled in production.
   */
  enableSafeRendering: boolean;

  /**
   * Whether to display the warped content
   *
   * @default true
   */
  enableContentDisplay: boolean;

  /**
   * Whether to display the warp grid
   *
   * Used for debugging warp effects, visually showing the triangulated mesh of warp divisions
   * @default false
   */
  enableGridDisplay: boolean;

  /**
   * Whether to display grid vertices
   *
   * Used for debugging the positions of grid vertices
   * @default false
   */
  enableGridVertexDisplay: boolean;

  /**
   * Grid and grid vertex color configuration
   * @property {number} r - Red channel value (0-255)
   * @property {number} g - Green channel value (0-255)
   * @property {number} b - Blue channel value (0-255)
   * @property {number} a - Transparency (0-1)
   * @default { r: 255, g: 0, b: 0, a: 1 } // Default red
   * @remarks In WebGL rendering mode, changes in transparency may affect the rendering result.
   */
  gridColor: { r: number; g: number; b: number; a: number };
}

/**
 * Warp deformation state data structure
 *
 * Contains core data required to describe the deformation state of a texture,
 * including split points and mesh deformation data.
 */
export type WarpState = {
  /**
   * List of relative positions of split points
   */
  splitPoints: Coord[];

  /**
   * Region boundary deformation data
   *
   * A 3D array storing the Bezier curve control points for the four edges of each split region:
   * - First dimension: Region row index
   * - Second dimension: Region column index
   * - Third dimension: Control points array for the four edges (top/right/bottom/left) of the region
   *
   * @example
   * // Example of boundary data for a 2x2 grid
   * regionBounds: [
   *   [
   *     { // Top-left region
   *       top: [{x: 0, y: 0}, ...],    // Control points for top edge
   *       right: [{x: 0, y: 0}, ...],  // Control points for right edge
   *       bottom: [{x: 0, y: 0}, ...], // Control points for bottom edge
   *       left: [{x: 0, y: 0}, ...]    // Control points for left edge
   *     },
   *     // ... Top-right region
   *   ],
   *   // ... Next row of regions
   * ]
   */
  regionBounds: Record<Direction, Coord[]>[][];
};

/**
 * Warp deformation class
 *
 * The warp deformation class can create corresponding deformation tool instances based on image sources,
 * and can apply deformation to images through internal methods to produce deformed graphic canvases.
 *
 * @example
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * if (!ctx) return;
 * // Draw a rectangle
 * ctx.fillRect(0, 0, canvas.width, canvas.height);
 *
 * // Create a Warpvas instance, passing the canvas as the image source
 * const warpvas = new Warpvas(canvas);
 *
 * // Drag the top-left corner of the original canvas image to position (50, 50)
 * warpvas.updateVertexCoord(0, 0, 'tl', { x: 50, y: 50 });
 *
 * // Generate the deformed canvas and add it to the document
 * const warpvasCanvas = warpvas.render();
 * document.body.appendChild(warpvasCanvas);
 */
export class Warpvas {
  /**
   * Source canvas object
   *
   * Stores the canvas containing the original image data. If an HTMLImageElement instance is passed to the constructor,
   * a new canvas will be automatically created and the image will be drawn onto it to avoid modifying the original image.
   */
  public source: HTMLCanvasElement;

  /**
   * List of relative positions of split points
   *
   * Stores the relative coordinates (range 0-1) of canvas split points. These points divide the canvas into multiple deformable regions,
   * where each split point's coordinates are proportional values relative to the canvas dimensions, not actual pixel values.
   *
   * @remarks To add split points, do not directly manipulate this list. Instead, use the splitRegionByPoint method to add split points.
   *
   * @see splitRegionByPoint Learn how to add split points to achieve region segmentation
   */
  public splitPoints: Coord[] = [];

  /**
   * Pre-deformation regions
   *
   * 2D array storing the four vertex coordinates of each rectangular region before deformation.
   *
   * @remarks Array structure: [region row][region column], each region contains four vertices:
   * top-left (tl), top-right (tr), bottom-left (bl), bottom-right (br)
   *
   * @example
   * // Access top-left coordinate of the first region
   * const topLeft = warpvas.originalRegions[0][0].tl;
   */
  public originalRegions: Region[][] = [];

  /**
   * Original grid points
   *
   * 3D array storing the coordinates of grid points within each region before deformation.
   * These coordinates are in their original state and used as mapping data for subsequent deformation calculations.
   *
   * @remarks Array structure: [region row][region column][list of grid points]
   */
  public originalRegionPoints: Coord[][][] = [];

  /**
   * Region boundary curves
   *
   * Stores the Bezier curve objects for the four edges of each region.
   */
  public regionBoundaryCurves: Record<Direction, Bezier>[][] = [];

  /**
   * Deformed grid curves
   *
   * Stores the grid lines of each region after deformation, including both vertical and horizontal Bezier curves.
   * These curves determine the final deformation effect of the image.
   *
   * @remarks To perform deformation, do not directly manipulate this list.
   * Instead, use the updateRegionBoundCoords method to adjust specific curves for boundary deformation effects.
   *
   * @see updateRegionBoundCoords Learn how to adjust region boundary curves to achieve deformation effects
   */
  public regionCurves: { vertical: Bezier[]; horizontal: Bezier[] }[][] = [];

  /**
   * Deformed grid points
   *
   * Stores the coordinates of grid points after deformation. The positions of these points are calculated by the split strategy,
   * and different strategies will produce different deformation effects.
   *
   * @remarks To perform deformation, do not directly manipulate this list.
   * Instead, use the updateVertexCoord/updateRegionBoundCoords methods to achieve deformation effects.
   *
   * @see Strategy Learn more about split strategies
   * @see updateVertexCoord Learn how to adjust region vertex coordinates for deformation
   * @see updateRegionBoundCoords Learn how to adjust region boundary curves for deformation
   */
  public regionPoints: Coord[][][] = [];

  /**
   * Grid split ratio
   *
   * Controls the density of the grid split, with a value range of 0-1. The smaller the value,
   * the denser the grid, resulting in finer deformation effects, but also increasing computation.
   * For example, when the value is 0.1, the maximum size of each grid is 10% of the image width.
   *
   * @default 0.05 Default value, meaning the maximum size of each grid is 5% of the image width.
   *
   * @see setSplitUnit Learn how to control the grid split ratio
   */
  public splitUnit = 0.05;

  /**
   * Split point calculation strategy
   *
   * Defines how to calculate the grid point positions inside the deformation region.
   * The built-in warp strategy is used by default, and you can also set a custom strategy through the setSplitStrategy method.
   *
   * @see setSplitStrategy Learn how to configure the split calculation strategy
   */
  public splitStrategy: Strategy = {
    name: 'default',
    execute: Warpvas.strategy,
  };

  /**
   * Rendering engine type
   *
   * Specifies the rendering method to use, supports '2d' or 'webgl'.
   * WebGL mode has better performance, and when safe rendering configuration is set,
   * it will automatically fallback to Canvas in environments where WebGL is not supported.
   *
   * @default 'webgl'
   *
   * @see setRenderingContext Learn how to switch rendering engines
   */
  public renderingContext: '2d' | 'webgl' = 'webgl';

  /**
   * Rendering options
   * Controls various parameters of the rendering process, including padding, anti-aliasing, debug grid display, etc.
   * These options can be dynamically modified through the setRenderingConfig method.
   *
   * @see RenderingConfig View all available rendering options
   * @see setRenderingConfig Learn how to configure rendering options
   */
  public renderingConfig: RenderingConfig = {
    padding: 0,
    enableAntialias: true,
    enableSafeRendering: true,
    enableContentDisplay: true,
    enableGridDisplay: false,
    enableGridVertexDisplay: false,
    gridColor: { r: 255, g: 0, b: 0, a: 1 },
  };

  /**
   * Safe rendering mode activation flag
   *
   * Indicates whether safe rendering mode is activated. When the first WebGL
   * rendering failure occurs with safe mode configured, this flag enables
   * subsequent renders to automatically downgrade to Canvas 2D rendering.
   */
  private _safeModeEnabled = false;

  /**
   * Image source dimensions cache
   *
   * Stores the current image source's dimension information,
   * triggers grid points recalculation when dimensions change.
   *
   * @private
   */
  private _cacheSourceSize: {
    width: number;
    height: number;
  } | null = null;

  /**
   * Source image data cache
   *
   * Stores the original image's pixel data to optimize performance during Web Worker rendering.
   * When using Web Workers for rendering, avoiding repeated image data retrieval can significantly improve performance.
   *
   * @private
   */
  private _cacheSourceImageData: ImageData | null = null;

  /**
   * Input canvas cache
   *
   * Stores the temporary canvas used for resizing input images.
   * Maintaining a separate cache canvas preserves the original image source and ensures data integrity.
   *
   * @private
   */
  private _cacheInputCanvas: HTMLCanvasElement | null = null;

  /**
   * Output canvas cache
   *
   * Stores the singleton canvas instance for rendering results.
   * Reusing the same canvas across multiple rendering operations reduces memory usage.
   *
   * @private
   * @see setRenderingCanvas Learn how to configure the output canvas in singleton mode
   */
  private _cacheOutputCanvas: HTMLCanvasElement | null = null;

  /**
   * Input size constraints
   *
   * Defines maximum dimensions allowed for input canvas.
   * Canvas exceeding these constraints will be proportionally scaled down to fit.
   *
   * @private
   * @see setInputLimitSize Learn how setting input size limits utilizes this cache
   */
  private _inputLimitSize: { width?: number; height?: number } | undefined;

  /**
   * Input scaling ratio
   *
   * Records the actual scaling factor caused by input size constraints.
   * When input images require resizing, this value captures the applied scaling ratio.
   *
   * @private
   * @default 1
   */
  private _inputLimitScale: number = 1;

  /**
   * Output size constraints
   *
   * Defines maximum dimensions allowed for output canvas.
   * Deformed results exceeding these constraints will be automatically scaled down proportionally to fit.
   *
   * @private
   * @see setOutputLimitSize Learn how to configure output size constraints
   * @remarks Proper configuration prevents performance issues and rendering failures caused by oversized canvases.
   */
  private _outputLimitSize: { width?: number; height?: number } | undefined;

  /**
   * Output scaling ratio
   *
   * Records the actual scaling factor resulting from output size constraints.
   * Captures the applied ratio when output canvas requires resizing.
   *
   * @private
   * @default 1
   */
  private _outputLimitScale: number = 1;

  /**
   * Warpvas constructor
   *
   * Creates a new warp deformation canvas instance. Accepts an image or canvas as source,
   * with optional initial grid division settings.
   *
   * @param source - Image source (HTMLImageElement or HTMLCanvasElement)
   *                - For images: auto-creates canvas and draws image
   *                - For canvases: uses directly as source
   *
   * @param rows - Initial horizontal divisions
   *              - Must be integer ≥ 1
   *              - 1 = no horizontal division
   *              - 2 = adds midline horizontal division
   *              - Default: 1
   *
   * @param columns - Initial vertical divisions
   *                - Must be integer ≥ 1
   *                - 1 = no vertical division
   *                - 2 = adds midline vertical division
   *                - Default: 1
   *
   * @example
   * // Create with image
   * const img = new Image();
   * img.src = 'example.jpg';
   * img.onload = () => new Warpvas(img);
   *
   * // Create with canvas and 2x2 grid
   * const canvas = document.createElement('canvas');
   * new Warpvas(canvas, 2, 2);
   */
  constructor(source: HTMLCanvasElement | HTMLImageElement, rows = 1, columns = 1) {
    if (!(source instanceof HTMLCanvasElement) && !(source instanceof HTMLImageElement)) {
      throw new TypeError('[Warpvas] source must be either HTMLCanvasElement or HTMLImageElement!');
    }

    // Initialize source canvas
    if (source instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D rendering context for canvas');
      }
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      ctx.drawImage(source, 0, 0);
      this.source = canvas;
    } else {
      this.source = source;
    }

    // Initialize split ratio points
    this.splitPoints = this._initializeSplitPoints(rows, columns);

    // Initialize warp state data
    this.setWarpState(this.splitPoints);
  }

  /**
   * Maximum split unit in pixels
   *
   * Calculates the maximum grid division size allowed for current texture in pixels.
   * This value is determined by splitUnit (division ratio) and image width.
   *
   * @returns {number} Maximum split unit in pixels
   *                   - When splitUnit is 0.1: returns 10% of image width
   *                   - When splitUnit is 0.05: returns 5% of image width
   *
   * @example
   * // Assuming image width is 1000px with splitUnit 0.1
   * const maxSize = warpvas.maxSplitUnitPixel; // Returns 100px
   *
   * @see splitUnit See split ratio configuration
   */
  get maxSplitUnitPixel(): number {
    return this.splitUnit * this.source.width;
  }

  /**
   * Actual scaling ratio of the canvas
   *
   * Returns the scaling ratio relative to original dimensions.
   * The ratio combines both input and output limitations:
   * - Input limitations: Automatic scaling when processing large images
   * - Output limitations: Prevents oversized canvas generation
   *
   * @returns {{ x: number, y: number }} Scaling ratios in x/y dimensions
   *                                     - 1 = original size
   *                                     - <1 = downscaled
   *                                     - x/y always equal to prevent distortion
   *
   * @example
   * const { x, y } = warpvas.scale;
   * console.log(`Canvas scaled to ${x * 100}% of original size`);
   */
  get scale(): { x: number; y: number } {
    return {
      x: this._inputLimitScale * this._outputLimitScale,
      y: this._inputLimitScale * this._outputLimitScale,
    };
  }

  /**
   * Built-in default warp splitting strategy
   *
   * Default grid splitting strategy that generates grid points by calculating
   * midpoints between intersections of horizontal/vertical Bezier curves.
   * This strategy effectively demonstrates planar warp effects, particularly
   * suitable for:
   * - Image bending deformation
   * - Perspective transformation
   * - Wave effect simulations
   *
   * @param warpvas - Current warp canvas instance
   * @returns 3D array containing grid coordinates of all split regions
   *          - 1st dimension: Region row index
   *          - 2nd dimension: Region column index
   *          - 3rd dimension: List of grid points in the region
   *
   * @example
   * // Default strategy is already applied, but can be explicitly set:
   * warpvas.setSplitStrategy({
   *   name: 'default',
   *   execute: Warpvas.strategy
   * });
   *
   * @remarks
   * Strategy workflow:
   * 1. Iterate through each split region
   * 2. Calculate intersections of horizontal/vertical Bezier curves within region
   * 3. Use midpoints of intersecting pairs as grid points
   * 4. Ensures uniform grid distribution that follows curve deformations
   */
  static strategy(warpvas: Warpvas) {
    const curves = warpvas.regionCurves;
    if (!curves) return [];

    const splitPoints: Coord[][][] = [];

    warpvas.regionBoundaryCurves.forEach((row, rowIndex) => {
      const _row: Coord[][] = [];
      row.forEach((col, colIndex) => {
        const _col: Coord[] = [];
        const { vertical, horizontal } = warpvas.regionCurves[rowIndex][colIndex];
        for (let h = 0; h < horizontal.length; h++) {
          for (let v = 0; v < vertical.length; v++) {
            const point1 = vertical[v].get(h / (horizontal.length - 1));
            const point2 = horizontal[h].get(v / (vertical.length - 1));
            _col.push({
              x: (point1.x + point2.x) / 2,
              y: (point1.y + point2.y) / 2,
            });
          }
        }
        _row.push(_col);
      });
      splitPoints.push(_row);
    });

    return splitPoints;
  }

  /**
   * Serialize warp state data
   *
   * Compresses warp deformation data into base64 string format for transmission/storage.
   * The compressed data includes:
   * - Split points configuration
   * - Region boundary deformations
   *
   * @param warpState - Warp state object containing:
   *                   - splitPoints: Grid division coordinates
   *                   - regionBounds: Boundary deformation data
   * @returns base64 encoded string representing compressed warp state
   *
   * @example
   * // 1. Get current warp state
   * const warpState = warpvas.getWarpState();
   *
   * // 2. Serialize data
   * const compressed = Warpvas.serializeWarpState(warpState);
   *
   * @see deserializeWarpState Restore compressed warp state
   * @see getWarpState Retrieve current deformation data
   */
  static serializeWarpState(warpState: WarpState) {
    const { splitPoints, regionBounds } = warpState;

    // Store metadata in array header
    const data: number[] = [splitPoints.length, regionBounds.length, regionBounds[0].length];

    // Flatten split points into number array
    splitPoints.forEach((point) => {
      data.push(point.x, point.y);
    });

    // Flatten region boundaries into number array
    const forEachDirections = ['top', 'right', 'bottom', 'left'];
    regionBounds.forEach((row) =>
      row.forEach((col) => [
        forEachDirections.forEach((dir) =>
          col[dir].forEach((i: Coord) => {
            data.push(i.x, i.y);
          }),
        ),
      ]),
    );

    const floatArray = new Float32Array(data);
    const byteArray = new Uint8Array(floatArray.buffer);
    const base64String = btoa(String.fromCharCode.apply(null, byteArray as unknown as number[]));
    return base64String;
  }

  /**
   * Deserialize compressed warp state
   *
   * Restores warp deformation data from base64 string generated by serializeWarpState.
   * The decompressed data can directly rebuild the texture's deformation state.
   *
   * @param base64String - base64 encoded string from serializeWarpState
   * @returns {Object} Decompressed warp state containing:
   *                   - splitPoints: Array of split coordinates (0-1 range)
   *                   - boundData: 2D array of boundary deformation data per region
   *
   * @example
   * // 1. Deserialize data
   * const { splitPoints, boundData } = Warpvas.deserializeWarpState(compressedData);
   *
   * // 2. Apply deformation state
   * warpvas.setWarpState(splitPoints, boundData);
   *
   * @see serializeWarpState Compress warp state
   * @see setWarpState Apply deformation configuration
   */
  static deserializeWarpState(base64String: string): WarpState {
    // Convert base64 to binary
    const binaryString = atob(base64String);

    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }

    const floatArray = new Float32Array(byteArray.buffer);
    const data = Array.from(floatArray);

    // Reconstruct original float array
    const forEachDirections = ['top', 'right', 'bottom', 'left'];
    const splitPointsLength = data[0];
    const rows = data[1];
    const cols = data[2];
    let index = 3;

    // Rebuild data structure
    const splitPoints: Coord[] = [];
    for (let i = 0; i < splitPointsLength; i++) {
      splitPoints.push({ x: data[index], y: data[index + 1] });
      index += 2;
    }

    // Extract split points
    const regionBounds: Record<Direction, Coord[]>[][] = [];
    for (let row = 0; row < rows; row++) {
      const rowData: (typeof regionBounds)[number] = [];
      for (let col = 0; col < cols; col++) {
        const _data = {} as Record<Direction, Coord[]>;
        for (const dir of forEachDirections) {
          _data[dir] = [];
          for (let i = 0; i < 4; i++) {
            _data[dir].push({ x: data[index], y: data[index + 1] });
            index += 2;
          }
        }
        rowData.push(_data);
      }
      regionBounds.push(rowData);
    }

    return { splitPoints, regionBounds };
  }

  /**
   * Initialize split ratio points
   *
   * Creates initial grid of split points using relative coordinates (0-1 range)
   * that partition the image into multiple deformable regions.
   *
   * @param rows - Horizontal divisions
   *               - Integer ≥ 1
   *               - Actual split lines = rows - 1
   *               - Example: rows=2 adds mid horizontal line
   *               - Default: 1 (no horizontal division)
   *
   * @param columns - Vertical divisions
   *                 - Integer ≥ 1
   *                 - Actual split lines = columns - 1
   *                 - Example: columns=2 adds mid vertical line
   *                 - Default: 1 (no vertical division)
   *
   * @returns Array of split coordinates as image size ratios (0-1)
   */
  private _initializeSplitPoints(rows = 1, columns = 1) {
    const maxRows = Math.max(Math.floor(rows), 1);
    const maxColumns = Math.max(Math.floor(columns), 1);

    const ratioPoints: Coord[] = [];
    for (let row = 1; row < maxRows; row++) {
      for (let col = 1; col < maxColumns; col++) {
        if (row === col) {
          ratioPoints.push({
            x: col / columns,
            y: row / rows,
          });
        }
      }
    }
    return ratioPoints;
  }

  /**
   * Initialize original regions
   *
   * Partitions the image into multiple rectangular regions based on split ratio points.
   * Each region contains four vertex coordinates in actual pixel positions (not ratios).
   *
   * @returns 2D array containing all region information:
   *          - 1st dimension: Row index
   *          - 2nd dimension: Column index
   *          - Each region contains four vertex coordinates (tl/tr/bl/br)
   */
  private _initializeOriginalRegions() {
    const { width, height } = this.source;

    let splitXs: number[] = [];
    let splitYs: number[] = [];

    this.splitPoints.forEach((coord) => {
      // Points outside the image are invalid
      if (coord.x < 0 || coord.x > 1 || coord.y < 0 || coord.y > 1) return;
      splitXs.push(coord.x);
      splitYs.push(coord.y);
    });

    // Remove duplicates
    splitXs = [...new Set([0, ...splitXs, 1])];
    splitYs = [...new Set([0, ...splitYs, 1])];

    // Sort (ascending)
    splitXs.sort((a, b) => a - b);
    splitYs.sort((a, b) => a - b);

    // Partition regions
    const regions: Region[][] = [];
    for (let row = 0; row < splitYs.length - 1; row++) {
      regions.push([]);
      for (let col = 0; col < splitXs.length - 1; col++) {
        regions[regions.length - 1].push({
          tl: { x: splitXs[col] * width, y: splitYs[row] * height },
          tr: { x: splitXs[col + 1] * width, y: splitYs[row] * height },
          bl: { x: splitXs[col] * width, y: splitYs[row + 1] * height },
          br: { x: splitXs[col + 1] * width, y: splitYs[row + 1] * height },
        });
      }
    }

    return regions;
  }

  /**
   * Calculate sampling points for region boundaries
   *
   * Computes Bezier curve sampling positions based on region dimensions.
   * Automatically adjusts point density to balance deformation quality and performance.
   *
   * @param region - Target region containing four vertices:
   *                - tl: Top-left
   *                - tr: Top-right
   *                - bl: Bottom-left
   *                - br: Bottom-right
   *
   * @returns Object containing sampling positions in two dimensions:
   *          - hts: Horizontal positions array (0-1 range)
   *          - vts: Vertical positions array (0-1 range)
   *
   * @remarks
   * t-value in Bezier curves represents relative position:
   * - t = 0: Curve start point
   * - t = 1: Curve end point
   * - 0 < t < 1: Intermediate point along the curve
   */
  private _calculateSamplingPoints(region: Region) {
    const width = region.tr.x - region.tl.x;
    const height = region.bl.y - region.tl.y;

    const horizontalCount = Math.max(Math.ceil(width / this.maxSplitUnitPixel), 1) + 1;
    const verticalCount = Math.max(Math.ceil(height / this.maxSplitUnitPixel), 1) + 1;

    const hts = Array.from({ length: horizontalCount }).map((_, i) => i / (horizontalCount - 1));
    const vts = Array.from({ length: verticalCount }).map((_, i) => i / (verticalCount - 1));

    return { hts, vts };
  }

  /**
   * Initialize grid points within partition regions
   *
   * Generates grid points based on initial partition regions. These points will be used for:
   * 1. Building reference grids during deformation
   * 2. Calculating texture mapping relationships
   * 3. Generating final deformation effects
   *
   * @returns 3D array containing all region grid points:
   *          - 1st dimension: Region row index
   *          - 2nd dimension: Region column index
   *          - 3rd dimension: List of grid points within the region
   */
  private _initializeOriginalRegionPoints() {
    return this.originalRegions.map((row) =>
      row.map((region) => {
        const { hts, vts } = this._calculateSamplingPoints(region);
        const points: Coord[] = [];
        const { tl, tr, bl } = region;
        const width = tr.x - tl.x;
        const height = bl.y - tl.y;
        for (let vt = 0; vt < vts.length; vt++) {
          for (let ht = 0; ht < hts.length; ht++) {
            points.push({
              x: tl.x + width * hts[ht],
              y: tl.y + height * vts[vt],
            });
          }
        }
        return points;
      }),
    );
  }

  /**
   * Initialize boundary Bezier curve control points
   *
   * Creates cubic Bezier curve control points for four boundaries of each partition region.
   * Initial state produces straight-line curves, which can be bent by adjusting control points.
   *
   * @param regions - Array of partition regions, each containing four vertex coordinates
   *
   * @returns 3D array containing all boundary control points:
   *          - 1st dimension: Region row index
   *          - 2nd dimension: Region column index
   *          - 3rd dimension: Directional control points array (top/right/bottom/left)
   *            Each direction contains 4 points: start, first control, second control, end
   *
   * @remarks
   * Cubic Bezier curve control points roles:
   * - P0 (Start): Curve's initial position
   * - P1 (First control): Controls tangent direction and curvature at start
   * - P2 (Second control): Controls tangent direction and curvature at end
   * - P3 (End): Curve's terminal position
   */
  private _initializeBoundaryControlPoints(regions: Region[][]) {
    const regionBoundaryCurvePoints: Record<Direction, Coord[]>[][] = [];

    regions.forEach((row) => {
      regionBoundaryCurvePoints.push([]);
      row.forEach((region) => {
        const { tl, tr, br, bl } = region;

        const borders = {
          top: [tl, tr],
          bottom: [bl, br],
          left: [tl, bl],
          right: [tr, br],
        } as const;

        const bounds = {} as Record<Direction, Coord[]>;
        for (const direction in borders) {
          // Retrieve boundary curve (defaults to straight line, converted to cubic Bezier curve representation)
          const [startPoint, endPoint] = borders[direction];
          bounds[direction] = [
            startPoint,
            {
              x: startPoint.x + ((endPoint.x - startPoint.x) * 1) / 3,
              y: startPoint.y + ((endPoint.y - startPoint.y) * 1) / 3,
            },
            {
              x: endPoint.x - ((endPoint.x - startPoint.x) * 1) / 3,
              y: endPoint.y - ((endPoint.y - startPoint.y) * 1) / 3,
            },
            endPoint,
          ];
        }
        regionBoundaryCurvePoints[regionBoundaryCurvePoints.length - 1].push(bounds);
      });
    });

    return regionBoundaryCurvePoints;
  }

  /**
   * Generate partition curve mesh within regions
   *
   * Creates internal mesh curves based on boundary Bezier curves. These curves form the deformation framework:
   * 1. Establish deformation reference grids
   * 2. Calculate texture mapping reference points
   * 3. Achieve smooth deformation effects
   *
   * @param bounds - Bezier curve objects for region boundaries
   * @param hts - Horizontal sampling positions array (0-1 range)
   * @param vts - Vertical sampling positions array (0-1 range)
   *
   * @returns Object containing mesh curves in two orientations:
   *          - vertical: Array of vertical Bezier curves
   *          - horizontal: Array of horizontal Bezier curves
   *
   * @see _calculateSamplingPoints Calculate sampling positions
   */
  private _generateRegionCurves(bounds: Record<Direction, Bezier>, hts: number[], vts: number[]) {
    const meshCurves: { vertical: Bezier[]; horizontal: Bezier[] } = {
      horizontal: [],
      vertical: [],
    };

    // Generate vertical partition curves between top and bottom boundaries
    hts.forEach((t) => {
      if (t === 0) {
        meshCurves.vertical.push(bounds.left);
        return;
      }
      if (t === 1) {
        meshCurves.vertical.push(bounds.right);
        return;
      }
      const p1 = bounds.top.get(t);
      const p2 = bounds.bottom.get(t);
      // Generate intermediate vertical curves between top and bottom boundaries
      const verticalCurve = new Bezier([
        p1,
        {
          x:
            p1.x +
            ((bounds.left.points[1].x - bounds.left.points[0].x) * (1 - t) +
              (bounds.right.points[1].x - bounds.right.points[0].x) * t),
          y:
            p1.y +
            ((bounds.left.points[1].y - bounds.left.points[0].y) * (1 - t) +
              (bounds.right.points[1].y - bounds.right.points[0].y) * t),
        },
        {
          x:
            p2.x +
            ((bounds.left.points[2].x - bounds.left.points[3].x) * (1 - t) +
              (bounds.right.points[2].x - bounds.right.points[3].x) * t),
          y:
            p2.y +
            ((bounds.left.points[2].y - bounds.left.points[3].y) * (1 - t) +
              (bounds.right.points[2].y - bounds.right.points[3].y) * t),
        },
        p2,
      ]);
      meshCurves.vertical.push(verticalCurve);
    });

    // Generate horizontal mesh between left and right boundaries
    vts.forEach((t) => {
      if (t === 0) {
        meshCurves.horizontal.push(bounds.top);
        return;
      }
      if (t === 1) {
        meshCurves.horizontal.push(bounds.bottom);
        return;
      }

      const p1 = bounds.left.get(t);
      const p2 = bounds.right.get(t);

      // Generate intermediate horizontal curves between left and right boundaries
      const horizontalCurve = new Bezier([
        p1,
        {
          x:
            p1.x +
            ((bounds.top.points[1].x - bounds.top.points[0].x) * (1 - t) +
              (bounds.bottom.points[1].x - bounds.bottom.points[0].x) * t),
          y:
            p1.y +
            ((bounds.top.points[1].y - bounds.top.points[0].y) * (1 - t) +
              (bounds.bottom.points[1].y - bounds.bottom.points[0].y) * t),
        },
        {
          x:
            p2.x +
            ((bounds.top.points[2].x - bounds.top.points[3].x) * (1 - t) +
              (bounds.bottom.points[2].x - bounds.bottom.points[3].x) * t),
          y:
            p2.y +
            ((bounds.top.points[2].y - bounds.top.points[3].y) * (1 - t) +
              (bounds.bottom.points[2].y - bounds.bottom.points[3].y) * t),
        },
        p2,
      ]);
      meshCurves.horizontal.push(horizontalCurve);
    });

    return meshCurves;
  }

  /**
   * Generate internal mesh curves for partition regions
   *
   * Creates internal grid curves based on boundary Bezier curves. These curves are used for:
   * 1. Building deformation reference grids
   * 2. Calculating texture mapping reference points
   * 3. Achieving smooth deformation effects
   *
   * @param regionBoundaryCurves - 3D array of region boundary curves
   *                        - 1st dimension: Row index
   *                        - 2nd dimension: Column index
   *                        - 3rd dimension: Four boundary Bezier curves per region (top/right/bottom/left)
   *
   * @returns 3D array containing all region mesh curves:
   *          - 1st dimension: Row index
   *          - 2nd dimension: Column index
   *          - 3rd dimension: Bezier curves in two orientations
   *            - vertical: Array of vertical curves
   *            - horizontal: Array of horizontal curves
   *
   * @see _generateRegionCurves Generate mesh curves for individual regions
   * @see _calculateSamplingPoints Calculate sampling positions
   */
  private _generateAllRegionCurves(regionBoundaryCurves: Record<Direction, Bezier>[][]) {
    const curves: { vertical: Bezier[]; horizontal: Bezier[] }[][] = [];

    regionBoundaryCurves.forEach((row, rowIndex) => {
      const partRegionCurves: (typeof curves)[number] = [];
      curves.push(partRegionCurves);
      row.forEach((col, colIndex) => {
        const bounds = col;

        const region = this.originalRegions[rowIndex][colIndex];
        const { hts, vts } = this._calculateSamplingPoints(region);

        partRegionCurves.push(this._generateRegionCurves(bounds, hts, vts));
      });
    });

    return curves;
  }

  /**
   * Set maximum ratio for deformation grid subdivision
   *
   * Controls the granularity of grid subdivision. Smaller values produce denser grids
   * for finer deformation effects, while increasing computational load.
   *
   * @param splitUnit - Maximum subdivision ratio value
   *                    - Range: Numerical value between 0-1
   *                    - 0.1: Maximum grid unit equals 10% of image width
   *                    - 0.05: Maximum grid unit equals 5% of image width
   *                    - Values ≤0 or >1 will be reset to 1
   *
   * @returns Instance itself for method chaining
   *
   * @example
   * // Set dense grid for finer deformation
   * warpvas.setSplitUnit(0.05);
   *
   * // Set sparse grid for better performance
   * warpvas.setSplitUnit(0.2);
   */
  setSplitUnit(splitUnit: number) {
    this.splitUnit = splitUnit <= 0 ? 1 : Math.min(1, splitUnit);

    // Initialize partition region points
    this.originalRegionPoints = this._initializeOriginalRegionPoints();

    return this;
  }

  /**
   * Set calculation strategy for grid subdivision points
   *
   * Customizes grid subdivision point calculation method. Different strategies enable
   * various deformation effects through alternative subdivision approaches.
   *
   * @param strategy - Subdivision strategy configuration object
   *                  - name: Strategy identifier (customizable)
   *                  - execute: Execution function receiving Warpvas instance
   *
   * @returns Instance itself for method chaining
   *
   * @example
   * // Using custom strategy
   * warpvas.setSplitStrategy({
   *   name: 'custom',
   *   execute: (warpvas) => {
   *     // Return custom grid points calculation
   *     return [[[{ x: 0, y: 0 }]]];
   *   }
   * });
   *
   * @see Warpvas.strategy Default strategy implementation
   */
  setSplitStrategy(strategy: Strategy) {
    this.splitStrategy = strategy;
    return this;
  }

  /**
   * Set size constraints for input canvas
   *
   * Restricts maximum dimensions of input canvas when processing large images.
   * System will automatically scale images proportionally within constraints to
   * improve performance and reduce memory consumption.
   *
   * @param limitSize - Size constraint configuration object
   *                    - width?: number - Maximum width in pixels
   *                    - height?: number - Maximum height in pixels
   *                    - Pass undefined to remove constraints
   *
   * @returns Instance itself for method chaining
   *
   * @example
   * // Constrain input to 1000x1000 pixels
   * warpvas.setInputLimitSize({
   *   width: 1000,
   *   height: 1000
   * });
   *
   * // Remove size constraints
   * warpvas.setInputLimitSize(undefined);
   *
   * @remarks
   * Performance recommendations:
   * 1. For large images (>2000px), recommend setting appropriate constraints
   * 2. Images maintain original aspect ratio when scaled
   * 3. Uses cached canvas to avoid repeated scaling operations
   */
  setInputLimitSize(limitSize: { width?: number; height?: number } | undefined) {
    this._inputLimitSize = limitSize;

    if (!limitSize) {
      this._inputLimitScale = 1;
      this._cacheInputCanvas = null;
    }

    // Clear cached source image data
    this._cacheSourceImageData = null;

    return this;
  }

  /**
   * Set size constraints for output canvas
   *
   * Restricts maximum dimensions of output canvas after deformation. When deformation results
   * exceed size limits, system automatically scales output proportionally to prevent
   * rendering failures due to memory constraints.
   *
   * @param limitSize - Size constraint configuration object
   *                    - width?: number - Maximum width in pixels
   *                    - height?: number - Maximum height in pixels
   *                    - Pass undefined to remove constraints
   *
   * @returns Instance itself for method chaining
   *
   * @example
   * // Constrain output to 2000x2000 pixels
   * warpvas.setOutputLimitSize({
   *   width: 2000,
   *   height: 2000
   * });
   *
   * // Remove size constraints (may cause large image rendering failures)
   * warpvas.setOutputLimitSize(undefined);
   *
   * @remarks
   * Performance recommendations:
   * 1. Unconstrained deformation may exceed browser's Canvas size limits, causing blank output
   * 2. Recommend setting appropriate constraints based on application scenarios
   * 3. Output dimensions significantly impact rendering performance and memory usage
   */
  setOutputLimitSize(limitSize: { width?: number; height?: number } | undefined) {
    this._outputLimitSize = limitSize;

    if (!limitSize) {
      this._outputLimitScale = 1;
    }

    return this;
  }

  /**
   * Set rendering engine type
   *
   * Configures the rendering engine to use Canvas2D or WebGL mode. Mode comparison:
   * - Canvas2D: Better compatibility (supports most browsers) but slower performance
   * - WebGL: Better performance (GPU accelerated) for large images, but limited compatibility
   *
   * @returns Returns the instance itself for method chaining
   *
   * @remarks
   * In safe rendering mode, the system will automatically fall back to Canvas2D
   * when WebGL is unavailable or rendering fails
   *
   * @example
   * // Enable Canvas2D rendering
   * warpvas.setRenderingContext('2d');
   *
   * // Enable WebGL rendering
   * warpvas.setRenderingContext('webgl');
   */
  setRenderingContext(ctx: '2d' | 'webgl') {
    this.renderingContext = ctx;
    return this;
  }

  /**
   * Set rendering output canvas
   *
   * Specifies a fixed canvas for rendering output. Reusing the same canvas across multiple
   * renders reduces memory allocation from canvas creation and improves performance.
   *
   * @param canvas - Target canvas element
   *
   * @returns Instance itself for method chaining
   *
   * @example
   * // Reuse canvas in animation loop
   * const canvas = document.createElement('canvas');
   * warpvas.setRenderingCanvas(canvas);
   *
   * function animate() {
   *   // Update content on the same canvas each frame
   *   warpvas.render();
   *   requestAnimationFrame(animate);
   * }
   *
   * @remarks
   * WARNING: Avoid using the same canvas for both input and output, as this forces
   * creating a temporary canvas copy before each render, significantly degrading performance
   */
  setRenderingCanvas(canvas: HTMLCanvasElement) {
    this._cacheOutputCanvas = canvas;
    return this;
  }

  /**
   * Set rendering configuration options
   *
   * Configures various parameters for texture mapping rendering. Allows partial
   * overriding of default configuration.
   *
   * @param options - Rendering configuration object
   *                - padding: number - Padding around output (pixels), default 0
   *                - enableAntialias: boolean - Enable/disable anti-aliasing, default true
   *                - enableSafeRendering: boolean - Safe rendering mode (WebGL only),
   *                  auto-fallback to Canvas2D on failure, default true
   *                - enableContentDisplay: boolean - Show warped content, default true
   *                - enableGridDisplay: boolean - Show deformation grid, default false
   *                - enableGridVertexDisplay: boolean - Show grid vertices, default false
   *                - gridColor: { r: number, g: number, b: number, a: number } -
   *                  Grid/vertex RGBA color object, default red (255,0,0,1)
   *
   * @returns Instance itself for method chaining
   *
   * @example
   * // Configure rendering parameters
   * warpvas.setRenderingConfig({
   *   padding: 10,                            // 10px padding
   *   enableAntialias: true,                  // Enable anti-aliasing
   *   enableSafeRendering: true,              // Enable safe mode
   *   enableContentDisplay: true,             // Display warped content
   *   enableGridDisplay: true,                // Show deformation grid
   *   gridColor: { r: 0, g: 255, b: 0, a: 1 } // Green grid color
   * });
   *
   * @remarks
   * Performance recommendations:
   * 1. Maintain enableSafeRendering=true in production environments
   * 2. Padding helps prevent visual clipping during deformation
   */
  setRenderingConfig(options: Partial<RenderingConfig>) {
    this.renderingConfig = {
      ...this.renderingConfig,
      ...options,
    };
    return this;
  }

  /**
   * Get bounding box information of warped image
   *
   * Calculates boundary dimensions and offsets after deformation. The values include
   * rendering configuration padding and can be used to properly size output canvas.
   *
   * @returns Bounding box information object containing:
   * @returns offsetX - X-axis offset in pixels
   * @returns offsetY - Y-axis offset in pixels
   * @returns width - Total width including padding (pixels)
   * @returns height - Total height including padding (pixels)
   *
   * @example
   * // Get warped image dimensions
   * const { width, height, offsetX, offsetY } = warpvas.getBoundingBoxInfo();
   *
   * // Apply dimensions to canvas
   * canvas.width = width;
   * canvas.height = height;
   *
   * // Adjust rendering position
   * ctx.translate(offsetX, offsetY);
   */
  getBoundingBoxInfo(): {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } {
    const { padding } = this.renderingConfig;

    const rowCount = this.regionCurves.length;
    const colCount = this.regionCurves[0].length;

    const bound = {
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      bottom: -Infinity,
    };

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const curves = this.regionCurves[row][col];
        Object.values(curves).forEach((array) => {
          const length = array.length;
          for (let i = 0; i < length; i++) {
            const curve = array[i];
            const bbox = curve.bbox();
            bound.left = Math.min(bound.left, bbox.x.min);
            bound.right = Math.max(bound.right, bbox.x.max);
            bound.top = Math.min(bound.top, bbox.y.min);
            bound.bottom = Math.max(bound.bottom, bbox.y.max);
          }
        });
      }
    }

    const boxInfo = {
      offsetX: -bound.left + padding,
      offsetY: -bound.top + padding,
      width: bound.right - bound.left + padding * 2,
      height: bound.bottom - bound.top + padding * 2,
    };

    return boxInfo;
  }

  /**
   * Clone source canvas element
   *
   * Creates a new canvas with identical dimensions and content from source canvas.
   *
   * @param canvas - Source canvas to clone
   * @param width - Optional width override (default: source canvas width)
   * @param height - Optional height override (default: source canvas height)
   *
   * @returns New canvas element with copied content
   */
  private _cloneCanvas(canvas: HTMLCanvasElement, width = canvas.width, height = canvas.height) {
    const cloneCanvas = document.createElement('canvas');
    cloneCanvas.width = width;
    cloneCanvas.height = height;
    const ctx = cloneCanvas.getContext('2d');
    ctx?.drawImage(canvas, 0, 0, width, height);
    return cloneCanvas;
  }

  /**
   * Create linear-like cubic Bezier curve
   *
   * Converts straight line between two points into cubic Bezier representation.
   * Evenly distributes control points along the line to maintain visual linearity
   * while preserving Bezier curve properties.
   *
   * @param p0 - Start point coordinates
   * @param p1 - End point coordinates
   *
   * @returns Array of 4 control points representing cubic Bezier curve:
   *          [start, first control, second control, end]
   */
  private _createLinearBezier(p0: Coord, p1: Coord) {
    return [
      p0,
      {
        x: p0.x + ((p1.x - p0.x) * 1) / 3,
        y: p0.y + ((p1.y - p0.y) * 1) / 3,
      },
      {
        x: p1.x - ((p1.x - p0.x) * 1) / 3,
        y: p1.y - ((p1.y - p0.y) * 1) / 3,
      },
      p1,
    ];
  }

  /**
   * Merge two Bezier curves
   *
   * Smoothly combines two adjacent Bezier curves into a single continuous curve.
   * Primarily used during split point removal operations to maintain smooth transitions
   * between merged curves.
   *
   * @param curve1Points - First curve's control points array [p0, p1, p2, p3]
   * @param curve2Points - Second curve's control points array [p0, p1, p2, p3]
   *
   * @returns Merged Bezier curve's control points array [p0, p1, p2, p3]
   */
  private _mergeBezierCurves(curve1Points: Coord[], curve2Points: Coord[]) {
    const calculateMergeComponents = (vector: Coord, vector1: Coord, vector2: Coord) => {
      const { x: a, y: b } = vector1;
      const { x: c, y: d } = vector2;

      // Calculate angle between two line segments (AB and CD)
      const radianAB = Math.atan2(b, a);
      const radianCD = Math.atan2(d, c);
      const radian = radianCD - radianAB;

      // Calculate length of CD vector
      const lengthCD = Math.sqrt(c ** 2 + d ** 2);

      // Calculate CD's projection length on AB direction
      const length = lengthCD * Math.cos(radian);

      // Calculate merged vector components after combining AB and CD projections
      const x = length * Math.cos(radianAB);
      const y = length * Math.sin(radianAB);

      return { x: vector.x + x, y: vector.y + y };
    };
    const pm1 = calculateMergeComponents(
      curve1Points[1],
      {
        x: curve1Points[1].x - curve1Points[0].x,
        y: curve1Points[1].y - curve1Points[0].y,
      },
      {
        x: curve2Points[1].x - curve2Points[0].x,
        y: curve2Points[1].y - curve2Points[0].y,
      },
    );
    const pm2 = calculateMergeComponents(
      curve2Points[2],
      {
        x: curve2Points[2].x - curve2Points[3].x,
        y: curve2Points[2].y - curve2Points[3].y,
      },
      {
        x: curve1Points[2].x - curve1Points[3].x,
        y: curve1Points[2].y - curve1Points[3].y,
      },
    );
    return [curve1Points[0], pm1, pm2, curve2Points[3]];
  }

  /**
   * Find connected vertex in deformation grid
   *
   * Retrieves position information of adjacent vertex connected to current boundary vertex.
   * Essential for maintaining grid continuity during vertex manipulation operations.
   *
   * @param direction - Current edge direction
   *                  - 'top': Top edge
   *                  - 'bottom': Bottom edge
   *                  - 'left': Left edge
   *                  - 'right': Right edge
   * @param position - Position on the edge
   *                - 'first': Start point of the edge
   *                - 'last': End point of the edge
   *
   * @returns Connected vertex information containing:
   *          - direction: Adjacent edge direction
   *          - position: Corresponding position on adjacent edge
   *
   * @see updateVertexCoord Used for updating vertex coordinates while maintaining grid continuity
   */
  private _findConnectedVertex(direction: string, position: 'first' | 'last') {
    const connectedVertexInfo = {
      top: [
        ['left', 0],
        ['right', 0],
      ],
      bottom: [
        ['left', 3],
        ['right', 3],
      ],
      left: [
        ['top', 0],
        ['bottom', 0],
      ],
      right: [
        ['top', 3],
        ['bottom', 3],
      ],
    }[direction];
    if (!connectedVertexInfo || !['first', 'last'].includes(position)) {
      throw TypeError(
        `[Warpvas] Invalid vertex connection parameters: direction="${direction}", position="${position}"\n` +
          'Expected values:\n' +
          '- direction: "top" | "bottom" | "left" | "right"\n' +
          '- position: "first" | "last"',
      );
    }
    const connectedVertex = connectedVertexInfo[{ first: 0, last: 1 }[position]] as [
      Direction,
      0 | 3,
    ];
    return {
      direction: connectedVertex[0],
      position: ({ 0: 'first', 3: 'last' } as const)[connectedVertex[1]],
    };
  }

  /**
   * Update coordinates for a single vertex
   *
   * Maintains grid continuity by updating both:
   * 1. Bezier curves on the vertex's two adjacent edges
   * 2. Connected vertex's edge curves in deformation grid
   *
   * @param rowIndex - Row index of target vertex
   * @param colIndex - Column index of target vertex
   * @param type - Vertex position type (tl/tr/bl/br)
   * @param coord - New coordinates { x, y }
   * @param redistribute - Control point redistribution flag
   *                     - true: Recalculate all control points (smooth transition)
   *                     - false: Only update endpoints (preserve original curvature)
   *                     - Default: true
   *
   * @see _findConnectedVertex Retrieve connected vertex information
   * @see _createLinearBezier Create Bezier curve control points
   */
  private _setSingleRegionVertexCoord(
    rowIndex: number,
    colIndex: number,
    type: VertexPosition,
    coord: Coord,
    redistribute = true,
  ) {
    /**
     * Update Bezier curve control points for specified edge vertex
     *
     * @param direction - Edge direction to update
     * @param position - Vertex position on edge ('first' or 'last')
     * @param vertexCoord - New coordinates for target vertex
     */
    const _updateVertexCoord = (
      direction: string,
      position: 'first' | 'last',
      vertexCoord: Coord,
    ) => {
      const bezier = this.regionBoundaryCurves[rowIndex]?.[colIndex]?.[direction] as Bezier;
      if (!bezier) return;

      const start = position === 'first' ? vertexCoord : bezier.points[0];
      const end = position === 'last' ? vertexCoord : bezier.points[3];

      bezier.points.forEach((point: Coord, index: number) => {
        // Skip updating middle control points when redistribute=false
        if (!redistribute && [1, 2].includes(index)) return;
        const curvePoint = this._createLinearBezier(start, end)[index];
        point.x = curvePoint.x;
        point.y = curvePoint.y;
      });
    };

    const [direction, position] = {
      [VertexPosition.TOP_LEFT]: ['top', 'first'],
      [VertexPosition.TOP_RIGHT]: ['top', 'last'],
      [VertexPosition.BOTTOM_LEFT]: ['bottom', 'first'],
      [VertexPosition.BOTTOM_RIGHT]: ['bottom', 'last'],
    }[type] as [Direction, 'first' | 'last'];

    // Update current vertex coordinates
    _updateVertexCoord(direction, position, coord);

    // Sync connected vertices in same region
    const syncVertex = this._findConnectedVertex(direction, position);
    _updateVertexCoord(syncVertex.direction, syncVertex.position, coord);
  }

  /**
   * Update coordinates for a warped texture vertex
   *
   * Moves specified vertex and automatically synchronizes all connected vertices
   * to maintain grid continuity across deformation regions.
   *
   * @param rowIndex - Target region's row index (0-based)
   * @param colIndex - Target region's column index (0-based)
   * @param vertexPosition - Vertex position type
   *                       - 'tl': Top-left
   *                       - 'tr': Top-right
   *                       - 'bl': Bottom-left
   *                       - 'br': Bottom-right
   * @param coord - New vertex coordinates { x, y }
   * @param redistribute - Control point recalculation flag
   *                     - true: Recalculate for smooth transition (default)
   *                     - false: Preserve existing curve shape
   *
   * @returns Current instance for method chaining
   *
   * @example
   * // Move top-left vertex of region (0,0) to (100,100)
   * warpvas.updateVertexCoord(
   *   0,                    // rowIndex
   *   0,                    // colIndex
   *   'tl',                 // vertexPosition
   *   { x: 100, y: 100 },   // New position
   *   true                  // Recalculate curves
   * );
   *
   * @remarks
   * Important considerations:
   * 1. Vertex movement affects all connected vertices and curves
   * 2. Setting redistribute=false preserves original curvature
   * 3. Invalid indices will be silently ignored
   */
  updateVertexCoord(
    rowIndex: number,
    colIndex: number,
    vertexPosition: `${VertexPosition}`,
    coord: Coord,
    redistribute = true,
  ) {
    // Update current vertex coordinates
    this._setSingleRegionVertexCoord(
      rowIndex,
      colIndex,
      vertexPosition as VertexPosition,
      coord,
      redistribute,
    );

    // Sync adjacent region vertices
    const vertexs = {
      [VertexPosition.TOP_LEFT]: [
        { row: rowIndex - 1, col: colIndex - 1, type: VertexPosition.BOTTOM_RIGHT },
        { row: rowIndex - 1, col: colIndex, type: VertexPosition.BOTTOM_LEFT },
        { row: rowIndex, col: colIndex - 1, type: VertexPosition.TOP_RIGHT },
      ],
      [VertexPosition.TOP_RIGHT]: [
        { row: rowIndex - 1, col: colIndex + 1, type: VertexPosition.BOTTOM_LEFT },
        { row: rowIndex, col: colIndex + 1, type: VertexPosition.TOP_LEFT },
        { row: rowIndex - 1, col: colIndex, type: VertexPosition.BOTTOM_RIGHT },
      ],
      [VertexPosition.BOTTOM_LEFT]: [
        { row: rowIndex, col: colIndex - 1, type: VertexPosition.BOTTOM_RIGHT },
        { row: rowIndex + 1, col: colIndex, type: VertexPosition.TOP_LEFT },
        { row: rowIndex + 1, col: colIndex - 1, type: VertexPosition.TOP_RIGHT },
      ],
      [VertexPosition.BOTTOM_RIGHT]: [
        { row: rowIndex, col: colIndex + 1, type: VertexPosition.BOTTOM_LEFT },
        { row: rowIndex + 1, col: colIndex, type: VertexPosition.TOP_RIGHT },
        { row: rowIndex + 1, col: colIndex + 1, type: VertexPosition.TOP_LEFT },
      ],
    }[vertexPosition];

    vertexs.forEach(({ row, col, type }) => {
      this._setSingleRegionVertexCoord(row, col, type, coord, redistribute);
    });

    return this;
  }

  /**
   * Update boundary curve coordinates for specified direction
   *
   * Modifies Bezier curve shape of region boundary by setting new control points,
   * allowing curvature adjustments while maintaining grid continuity.
   *
   * @param rowIndex - Target region's row index (0-based)
   * @param colIndex - Target region's column index (0-based)
   * @param direction - Boundary direction to update
   *                 - 'top': Top boundary
   *                 - 'right': Right boundary
   *                 - 'bottom': Bottom boundary
   *                 - 'left': Left boundary
   * @param coords - Bezier curve control points array containing:
   *               - p0: Start point coordinates
   *               - pm0: First control point coordinates
   *               - pm1: Second control point coordinates
   *               - p1: End point coordinates
   *
   * @returns Current instance for method chaining
   *
   * @example
   * // Create S-shaped top boundary curve
   * warpvas.updateRegionBoundCoords(
   *   0,                    // rowIndex
   *   0,                    // colIndex
   *   'top',                // direction
   *   [
   *     { x: 0, y: 0 },    // Start point
   *     { x: 30, y: 20 },  // Control point 1
   *     { x: 70, y: -20 }, // Control point 2
   *     { x: 100, y: 0 }   // End point
   *   ]
   * );
   *
   * @see updateVertexCoord For updating individual vertices
   */
  updateRegionBoundCoords(
    rowIndex: number,
    colIndex: number,
    direction: `${Direction}`,
    coords: [p0: Coord, pm0: Coord, pm1: Coord, p1: Coord],
  ) {
    this.regionBoundaryCurves = this._initializeRegionBoundaryCurves(
      this.forEachRegionBoundCoords((row, col, dir, bezier) => {
        if (row === rowIndex && col === colIndex && direction === dir) return coords;
        return bezier.points.map((coord) => ({
          x: coord.x,
          y: coord.y,
        }));
      }),
    );

    this.updateVertexCoord(
      rowIndex,
      colIndex,
      (
        {
          top: VertexPosition.TOP_LEFT,
          right: VertexPosition.TOP_RIGHT,
          bottom: VertexPosition.BOTTOM_LEFT,
          left: VertexPosition.TOP_LEFT,
        } as const
      )[direction],
      coords[0],
      false,
    );

    this.updateVertexCoord(
      rowIndex,
      colIndex,
      (
        {
          top: VertexPosition.TOP_RIGHT,
          right: VertexPosition.BOTTOM_RIGHT,
          bottom: VertexPosition.BOTTOM_RIGHT,
          left: VertexPosition.BOTTOM_LEFT,
        } as const
      )[direction],
      coords[3],
      false,
    );

    return this;
  }

  /**
   * Retrieve boundary curve control points for all regions
   *
   * Exports Bezier curve control point data for all deformation regions' boundaries.
   * The returned data structure maintains full grid topology information for:
   * 1. Serializing/deserializing warp states
   * 2. Implementing undo/redo functionality
   * 3. Cross-instance deformation synchronization
   *
   * @param callback - Custom data processor (optional)
   *                 - rowIndex: Region's row index
   *                 - colIndex: Region's column index
   *                 - direction: Boundary direction ('top'|'right'|'bottom'|'left')
   *                 - bezier: Bezier curve object containing control points
   *                 - Default returns raw control point array
   *
   * @returns Three-dimensional array containing:
   *         - 1st dimension: Row indices
   *         - 2nd dimension: Column indices
   *         - 3rd dimension: Control points for four boundaries
   *           - top: Top boundary points [start, cp1, cp2, end]
   *           - right: Right boundary points
   *           - bottom: Bottom boundary points
   *           - left: Left boundary points
   *
   * @example
   * // Get all boundary data with normalized coordinates
   * const normalizedData = warpvas.forEachRegionBoundCoords(
   *   (row, col, dir, bezier) => bezier.points.map(p => ({
   *     x: p.x / sourceWidth,
   *     y: p.y / sourceHeight
   *   }))
   * );
   *
   * @remarks
   * Return format specification:
   * [
   *   [ // Row 0
   *     { // Column 0
   *       top: [{x,y}, {x,y}, {x,y}, {x,y}],    // 4 control points
   *       right: [{x,y}, {x,y}, {x,y}, {x,y}],  // 4 control points
   *       bottom: [{x,y}, {x,y}, {x,y}, {x,y}], // 4 control points
   *       left: [{x,y}, {x,y}, {x,y}, {x,y}]    // 4 control points
   *     },
   *     // More columns...
   *   ],
   *   // More rows...
   * ]
   *
   * @see updateRegionBoundCoords For modifying boundary curves
   */
  forEachRegionBoundCoords(
    callback: (
      rowIndex: number,
      colIndex: number,
      direction: Direction,
      bezier: Bezier,
    ) => Coord[] = (row, col, direction, bezier) => bezier.points,
  ) {
    const boundPoints: Record<Direction, Coord[]>[][] = [];

    this.regionBoundaryCurves.forEach((row, rowIdx) => {
      boundPoints.push([]);
      row.forEach((col, colIdx) => {
        boundPoints[boundPoints.length - 1].push(
          (['top', 'right', 'left', 'bottom'] as Direction[]).reduce(
            (result, direction) => {
              result[direction] = callback(rowIdx, colIdx, direction, col[direction]);
              return result;
            },
            {} as Record<Direction, Coord[]>,
          ),
        );
      });
    });

    return boundPoints;
  }

  /**
   * Initialize Bezier curve objects for region boundaries
   *
   * Converts boundary control point data into Bezier curve instances while
   * reusing shared boundary curves between adjacent regions.
   *
   * @param regionBoundsCoords - 3D array structure containing:
   *                           - 1st dimension: Row indices
   *                           - 2nd dimension: Column indices
   *                           - 3rd dimension: Control points for four boundaries:
   *                             - top: [start, cp1, cp2, end]
   *                             - right: [start, cp1, cp2, end]
   *                             - bottom: [start, cp1, cp2, end]
   *                             - left: [start, cp1, cp2, end]
   *
   * @returns Curves array mirroring input structure:
   *         - 1st dimension: Row indices
   *         - 2nd dimension: Column indices
   *         - 3rd dimension: Four Bezier curve objects per region
   *
   * @see Bezier bezier-js library class for curve calculations
   */
  private _initializeRegionBoundaryCurves(regionBoundsCoords: Record<Direction, Coord[]>[][]) {
    const regionBoundaryCurves: Record<Direction, Bezier>[][] = [];

    regionBoundsCoords.forEach((row, rowIndex) => {
      regionBoundaryCurves.push([]);
      row.forEach((col, colIndex) => {
        const bounds = {};
        for (const direction in col) {
          switch (direction) {
            case 'top': {
              const sameBound = regionBoundaryCurves[rowIndex - 1]?.[colIndex]?.bottom;
              if (sameBound) {
                bounds[direction] = sameBound;
              }
              break;
            }
            case 'left': {
              const sameBound = regionBoundaryCurves[rowIndex]?.[colIndex - 1]?.right;
              if (sameBound) {
                bounds[direction] = sameBound;
              }
              break;
            }
            default:
              break;
          }
          if (!bounds[direction]) {
            const pointers = col[direction] as [p0: Coord, pm0: Coord, pm1: Coord, p1: Coord];
            bounds[direction] = new Bezier(
              pointers[0].x,
              pointers[0].y,
              pointers[1].x,
              pointers[1].y,
              pointers[2].x,
              pointers[2].y,
              pointers[3].x,
              pointers[3].y,
            );
          }
        }
        regionBoundaryCurves[regionBoundaryCurves.length - 1].push(
          bounds as Record<Direction, Bezier>,
        );
      });
    });

    return regionBoundaryCurves;
  }

  /**
   * Retrieve complete deformation state data
   *
   * @returns {WarpState} Deformation state object containing:
   *         - splitPoints: Array of split points with normalized coordinates (0-1 range)
   *         - regionBounds: 3D array of boundary control points for all regions
   *
   * @remarks
   * Data structure specifications:
   * - splitPoints: Normalized coordinates relative to original texture dimensions
   * - regionBounds: Hierarchical array structure [rows][columns][boundaryDirections]
   * - Each boundary contains exactly 4 control points in order: [p0, pm0, pm1, p1]
   *
   * @see setWarpState Apply saved deformation state
   * @see resetWarpState Restore default grid configuration
   */
  getWarpState(): WarpState {
    const regionBounds = this.forEachRegionBoundCoords();
    return { splitPoints: this.splitPoints, regionBounds };
  }

  /**
   * Apply saved deformation state configuration
   *
   * Updates texture deformation using provided warp data, supporting:
   * 1. State restoration from serialized data
   * 2. Cross-instance deformation replication
   * 3. Template-based warp applications
   *
   * @param splitPoints - Array of normalized split points (0-1 range)
   * @param regionBounds - Boundary curve data (optional)
   *                  - When provided: Directly sets boundary curves
   *                  - When null: Generates linear boundaries from split points
   *
   * @returns Current instance for method chaining
   *
   * @example
   * // 1. Apply complete warp state
   * const data = sourceWarpvas.getWarpState();
   * sourceWarpvas.setWarpState(data.splitPoints, data.regionBounds);
   *
   * // 2. Reset to non-warped state with central split
   * warpvas.setWarpState([
   *   { x: 0.5, y: 0.5 }  // Add central split point
   * ]);
   *
   * @remarks
   * Critical implementation details:
   * 1. Split points must be normalized (0-1 range)
   * 2. Automatic linear boundaries maintain grid continuity
   * 3. Control point order: [p0, pm0, pm1, p1] per boundary
   *
   * @see getWarpState Retrieve current deformation state
   * @see resetWarpState Restore default grid configuration
   */
  setWarpState(splitPoints: Coord[], regionBounds: Record<Direction, Coord[]>[][] | null = null) {
    this.splitPoints = splitPoints;

    // Cache source image dimensions
    const { width, height } = this.source;
    this._cacheSourceSize = { width, height };

    // Initialize base regions
    this.originalRegions = this._initializeOriginalRegions();

    // Initialize base region points
    this.originalRegionPoints = this._initializeOriginalRegionPoints();

    // Set boundary curves coordinates
    if (regionBounds) {
      this.regionBoundaryCurves = this._initializeRegionBoundaryCurves(regionBounds);
    } else {
      // Initialize actual split points coordinates
      const boundaryControlPoints = this._initializeBoundaryControlPoints(this.originalRegions);
      this.regionBoundaryCurves = this._initializeRegionBoundaryCurves(boundaryControlPoints);
    }

    return this;
  }

  /**
   * Restore default grid configuration
   *
   * Resets texture deformation to initial grid state by:
   * 1. Clearing all split points
   * 2. Recreating straight-line boundaries
   * 3. Rebuilding specified grid topology
   *
   * @param rows - Number of grid rows (default: 1)
   * @param columns - Number of grid columns (default: 1)
   *
   * @returns Current instance for method chaining
   *
   * @example
   * // 1. Reset to default 1x1 grid
   * warpvas.resetWarpState();
   *
   * // 2. Reset to 3x2 grid
   * warpvas.resetWarpState(3, 2);
   *
   * @see setWarpState Apply custom deformation state
   * @see getWarpState Retrieve current deformation state
   */
  resetWarpState(rows = 1, columns = 1) {
    this.splitPoints = this._initializeSplitPoints(rows, columns);
    return this.setWarpState(this.splitPoints);
  }

  /**
   * Verify texture deformation status
   *
   * Determines if the texture is in its original undeformed state by checking:
   * 1. Absence of split points (empty splitPoints array)
   * 2. All boundaries remain linear (no Bezier curve deformation)
   * 3. Boundary positions match original texture edges
   *
   * @returns {boolean}
   * - true: Texture is in pristine undeformed state
   * - false: Texture has deformation or splits
   */
  isUnwarped(): boolean {
    const coordinates = this.forEachRegionBoundCoords((row, col, direction, bezier) =>
      bezier.points.map((coord) => ({
        x: coord.x / this.source.width,
        y: coord.y / this.source.height,
      })),
    );
    return (
      this.splitPoints.length === 0 &&
      Object.entries(coordinates[0][0]).every(([dir, item]) => {
        const axial1Value = ['right', 'bottom'].includes(dir) ? 1 : 0;
        const axial1 = { top: 'y', bottom: 'y', left: 'x', right: 'x' }[dir]!;
        const axial2 = { top: 'x', bottom: 'x', left: 'y', right: 'y' }[dir]!;
        return (
          item.every((i) => i[axial1] === axial1Value) &&
          item[0][axial2] === 0 &&
          Math.abs(item[1][axial2] - 1 / 3) < Number.EPSILON &&
          Math.abs(item[2][axial2] - 2 / 3) < Number.EPSILON &&
          item[3][axial2] === 1
        );
      })
    );
  }

  /**
   * Detect hit position in warped texture
   *
   * Determines if a coordinate point lies within the deformed texture area
   * and returns detailed positional metadata. Typical use cases include:
   * 1. Implementing mouse interaction features
   * 2. Validating click positions
   * 3. Retrieving region-specific details
   *
   * @param point - Coordinate to test
   *              - x: X position in pixels
   *              - y: Y position in pixels
   *
   * @returns Hit information object containing:
   *         - rowIndex: Region row index
   *         - colIndex: Region column index
   *         - row: Grid row number
   *         - col: Grid column number
   *         - before: Original quad vertices [TL, TR, BR, BL]
   *         - after: Deformed quad vertices [TL, TR, BR, BL]
   *         - clickPart: Sub-region triangle identifier (0: upper, 1: lower)
   *         Returns null if point is outside texture
   *
   * @example
   * // Detect canvas click position
   * canvas.addEventListener('click', (e) => {
   *   const hitInfo = warpvas.getHitInfo({
   *     x: e.clientX - canvas.offsetLeft,
   *     y: e.clientY - canvas.offsetTop
   *   });
   * });
   */
  getHitInfo(point: Coord): {
    rowIndex: number;
    colIndex: number;
    row: number;
    col: number;
    before: Coord[];
    after: Coord[];
    clickPart: 0 | 1;
  } | null {
    let info: ReturnType<Warpvas['getHitInfo']> = null;
    try {
      this.forEachSplitRegion(([a, b, c, d], _, row, col, rowIndex, colIndex) => {
        const isClickUpPart = isTriangleContainsPoint(point, a, b, d);
        const isClickDownPart = isTriangleContainsPoint(point, c, b, d);
        if (isClickUpPart || isClickDownPart) {
          info = {
            rowIndex,
            colIndex,
            row,
            col,
            after: [a, b, c, d],
            before: _,
            clickPart: isClickUpPart ? 0 : 1,
          };
          throw Error();
        }
      });
    } catch {
      // Early exit marker for traversal termination
    }
    return info;
  }

  /**
   * Add split point to partition region
   *
   * Inserts a new split point in specified region to create sub-regions.
   *
   * @param rowIndex - Target region row index (0-based)
   * @param colIndex - Target region column index (0-based)
   * @param point - Split point coordinates in pixels
   *              - x: Horizontal position
   *              - y: Vertical position
   * @param tolerate - Tolerance threshold for boundary snapping (default: 0.05)
   *                - Range: 0-1 (normalized)
   *                - Points near boundaries within tolerance will snap to edges
   *                - Higher values prevent tiny sub-regions near boundaries
   *
   * @example
   * // Split center of first region (0,0) with 10% tolerance
   * const region = warpvas.originalRegions[0][0];
   * warpvas.splitRegionByPoint(
   *   0,    // rowIndex
   *   0,    // colIndex
   *   {     // Region center
   *     x: (region.tl.x + region.br.x) / 2,
   *     y: (region.tl.y + region.br.y) / 2
   *   },
   *   0.1   // 10% tolerance
   * );
   *
   * @remarks
   * Implementation notes:
   * 1. Split points modify adjacent region boundaries using Bezier curve blending
   * 2. Complex deformations may require recalculating neighboring regions
   * 3. Excessive split points may impact performance
   *
   * @see removeRegion Remove split points and merge regions
   */
  splitRegionByPoint(rowIndex: number, colIndex: number, point: Coord, tolerate = 0.05) {
    const { tl, tr, bl } = this.originalRegions[rowIndex][colIndex];
    let ht = (point.x - tl.x) / (tr.x - tl.x);
    let vt = (point.y - tl.y) / (bl.y - tl.y);

    if (ht < tolerate) ht = 0;
    if (ht > 1 - tolerate) ht = 1;

    if (vt < tolerate) vt = 0;
    if (vt > 1 - tolerate) vt = 1;

    const newBoundData: Record<Direction, Coord[]>[][] = [];

    // Process rows first
    this.regionBoundaryCurves.forEach((row, index) => {
      if (index !== rowIndex || vt === 0 || vt === 1) {
        newBoundData.push(
          row.map((col) => {
            const object = {} as Record<Direction, Coord[]>;
            for (const direction in col) {
              object[direction] = col[direction].points;
            }
            return object;
          }),
        );
        return;
      }
      const ups: Record<Direction, Coord[]>[] = [];
      const downs: Record<Direction, Coord[]>[] = [];
      row.forEach((col) => {
        const { horizontal, vertical } = this._generateRegionCurves(col, [0, 1], [0, vt, 1]);
        const { left: lt, right: lb } = vertical[0].split(vt);
        const { left: rt, right: rb } = vertical[1].split(vt);
        ups.push({
          left: lt.points,
          right: rt.points,
          top: horizontal[0].points,
          bottom: horizontal[1].points,
        });
        downs.push({
          left: lb.points,
          right: rb.points,
          top: horizontal[1].points,
          bottom: horizontal[2].points,
        });
      });
      newBoundData.push(ups, downs);
    });

    // Process columns
    if (ht !== 0 && ht !== 1) {
      newBoundData.forEach((row, rIndex) => {
        const { horizontal, vertical } = this._generateRegionCurves(
          {
            left: new Bezier(row[colIndex].left),
            right: new Bezier(row[colIndex].right),
            top: new Bezier(row[colIndex].top),
            bottom: new Bezier(row[colIndex].bottom),
          },
          [0, ht, 1],
          [0, 1],
        );
        const { left: _tl, right: _tr } = horizontal[0].split(ht);
        const { left: _bl, right: _br } = horizontal[1].split(ht);
        newBoundData[rIndex].splice(
          colIndex,
          1,
          {
            left: vertical[0].points,
            right: vertical[1].points,
            top: _tl.points,
            bottom: _bl.points,
          },
          {
            left: vertical[1].points,
            right: vertical[2].points,
            top: _tr.points,
            bottom: _br.points,
          },
        );
      });
    }

    this.setWarpState(
      [
        ...this.splitPoints,
        {
          x: (ht === 0 ? tl.x : ht === 1 ? tr.x : point.x) / this.source.width,
          y: (vt === 0 ? tl.y : vt === 1 ? bl.y : point.y) / this.source.height,
        },
      ],
      newBoundData,
    );
  }

  /**
   * Remove specified deformation regions
   *
   * Deletes one or more deformation regions while maintaining grid continuity
   * through automatic region merging.
   *
   * @param positions - Array of region positions to remove
   *                  - Each position contains row and column indices (0-based)
   *
   * @example
   * // Remove region at row 1, column 1
   * warpvas.removeRegion(
   *   {
   *     row: 1,
   *     column: 1
   *   }
   * );
   *
   * @remarks
   * Implementation details:
   * 1. Removal is invalid for:
   *    - Corner vertices of the image
   *    - Positions outside valid region bounds
   *    - Non-existent split points
   *
   * 2. Removal sequence:
   *    - Merge rows (bottom to top)
   *    - Merge columns (right to left)
   *    - Automatically smooth boundary curve transitions
   *
   * 3. Performance considerations:
   *    - Batch removal of multiple points is recommended over single-point operations
   */
  removeRegion(...positions: { row: number; column: number }[]) {
    // Build all split points
    const splitPoints: Coord[] = [];
    const { width, height } = this.source;
    const splitRegionByPoint = (point: Coord, rowIndex: number, colIndex: number) => {
      // Filter target removal rows/columns
      if (positions.some((item) => item.row === rowIndex || item.column === colIndex)) return;
      // Filter corner vertices
      if (rowIndex === 0 && colIndex === 0) return;
      if (rowIndex === this.originalRegions.length && colIndex === 0) return;
      if (rowIndex === 0 && colIndex === this.originalRegions[0].length) return;
      if (rowIndex === this.originalRegions.length && colIndex === this.originalRegions[0].length)
        return;
      // Filter same row/column split points
      if (
        splitPoints.some(
          (item) =>
            item.x === point.x || colIndex === 0 || colIndex === this.originalRegions[0].length,
        ) &&
        splitPoints.some(
          (item) =>
            item.y === point.y || rowIndex === 0 || rowIndex === this.originalRegions.length,
        )
      )
        return;
      splitPoints.push({ x: point.x / width, y: point.y / height });
    };
    this.originalRegions.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        const { tl, tr, bl, br } = col;
        splitRegionByPoint(tl, rowIndex, colIndex);
        if (colIndex === row.length - 1) {
          splitRegionByPoint(tr, rowIndex, colIndex + 1);
        }
        if (rowIndex === this.originalRegions.length - 1) {
          splitRegionByPoint(bl, rowIndex + 1, colIndex);
          if (colIndex === row.length - 1) {
            splitRegionByPoint(br, rowIndex + 1, colIndex + 1);
          }
        }
      });
    });

    const newBoundData: Record<Direction, Coord[]>[][] = this.forEachRegionBoundCoords();

    // Merge rows first
    const mergeRows = [...new Set(positions.map((i) => i.row))];
    mergeRows.sort((a, b) => b - a);
    mergeRows.forEach((rowIdx) => {
      const row = newBoundData[rowIdx];
      const preRow = newBoundData[rowIdx - 1];
      if (!row || !preRow) return;
      newBoundData.splice(
        rowIdx - 1,
        2,
        preRow.map((col, idx) => ({
          top: col.top,
          left: this._mergeBezierCurves(col.left, row[idx].left),
          right: this._mergeBezierCurves(col.right, row[idx].right),
          bottom: row[idx].bottom,
        })),
      );
    });

    // Merge columns
    const mergeCols = [...new Set(positions.map((i) => i.column))];
    mergeCols.sort((a, b) => b - a);
    mergeCols.forEach((colIdx) => {
      newBoundData.forEach((row) => {
        const col = row[colIdx];
        const preCol = row[colIdx - 1];
        if (!col || !preCol) return;
        row.splice(colIdx - 1, 2, {
          top: this._mergeBezierCurves(preCol.top, col.top),
          left: preCol.left,
          right: col.right,
          bottom: this._mergeBezierCurves(preCol.bottom, col.bottom),
        });
      });
    });

    this.setWarpState(splitPoints, newBoundData);
  }

  /**
   * Iterate through all quadrilateral cells in deformation grid
   *
   * Traverses each quadrilateral cell in the warped mesh and provides
   * their pre/post-deformation vertex information.
   *
   * @param handler - Callback function handling each quadrilateral
   *                Receives parameters:
   *                - newVertexs: Deformed vertices [TL, TR, BR, BL]
   *                - oldVertexs: Original vertices [TL, TR, BR, BL]
   *                - row: Row index within current region
   *                - col: Column index within current region
   *                - rowIndex: Parent region row index
   *                - colIndex: Parent region column index
   *
   * @example
   * // Iterate through all grid cells and log position info
   * warpvas.forEachSplitRegion((newVertexs, oldVertexs, row, col, rowIndex, colIndex) => {
   *   console.log(`Region[${rowIndex},${colIndex}] sub-grid[${row},${col}]:`);
   *   console.log('Original:', oldVertexs);
   *   console.log('Deformed:', newVertexs);
   * });
   */
  forEachSplitRegion(
    handler: (
      newVertexs: [leftTop: Coord, rightTop: Coord, bottomRight: Coord, bottomLeft: Coord],
      oldVertexs: [leftTop: Coord, rightTop: Coord, bottomRight: Coord, bottomLeft: Coord],
      row: number,
      col: number,
      rowIndex: number,
      colIndex: number,
    ) => void,
  ) {
    // Draw all triangle primitives
    this.regionPoints.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        const points = col;
        const columns = this.regionCurves[rowIndex][colIndex].vertical.length - 1;
        points.forEach((_, i) => {
          const _row = Math.floor(i / (columns + 1));
          const _col = i % (columns + 1);

          // Get four points of the quadrilateral
          const a = points[i];
          const b = points[i + 1];
          const c = points[i + columns + 2];
          const d = points[i + columns + 1];

          // Get original quadrilateral points
          const a0 = this.originalRegionPoints[rowIndex][colIndex][i];
          const b0 = this.originalRegionPoints[rowIndex][colIndex][i + 1];
          const c0 = this.originalRegionPoints[rowIndex][colIndex][i + columns + 2];
          const d0 = this.originalRegionPoints[rowIndex][colIndex][i + columns + 1];

          if (b && c && i % (columns + 1) < columns) {
            handler([a, b, c, d], [a0, b0, c0, d0], _row, _col, rowIndex, colIndex);
          }
        });
      });
    });
  }

  /**
   * Generate rendering configuration parameters
   *
   * Processes the following aspects to prepare for texture rendering:
   * 1. Calculate deformation grid and split points
   * 2. Handle canvas size constraints and scaling
   * 3. Prepare rendering canvases and parameters
   *
   * @returns Configuration object containing:
   *         - inputCanvas: Source canvas (original image or cached scaled version)
   *         - outputCanvas: Target canvas instance (specified or null)
   *         - options: Rendering parameters
   *           - x: Horizontal rendering offset
   *           - y: Vertical rendering offset
   *           - width: Rendered width
   *           - height: Rendered height
   *           - sourceScale: Input canvas scaling factor
   *           - destinationScale: Output canvas scaling factor
   */
  private _generateRenderOptions() {
    // Recalculate mesh if source dimensions changed
    if (
      this._cacheSourceSize &&
      (this._cacheSourceSize.width !== this.source.width ||
        this._cacheSourceSize.height !== this.source.height)
    ) {
      this.setWarpState(this.splitPoints);
    }

    // Generate subdivided mesh
    this.regionCurves = this._generateAllRegionCurves(this.regionBoundaryCurves);

    // Calculate all split points using division strategy
    this.regionPoints = this.splitStrategy.execute(this);

    // Compute transformed image offset and dimensions
    const { offsetX, offsetY, width, height } = this.getBoundingBoxInfo();

    // Process input canvas size constraints
    if (this._inputLimitSize && !this._cacheInputCanvas) {
      const limitSize = this._inputLimitSize;
      const { width, height } = this.source;

      const scale = {
        width: limitSize.width ? Math.min(1, limitSize.width / width) : 0,
        height: limitSize.height ? Math.min(1, limitSize.height / height) : 0,
      };
      scale.width = scale.width || scale.height;
      scale.height = scale.height || scale.width;
      const inputLimitScale = Math.min(scale.width, scale.height);

      const cacheCanvas = document.createElement('canvas');
      cacheCanvas.width = Math.ceil(width * inputLimitScale);
      cacheCanvas.height = Math.ceil(height * inputLimitScale);
      const ctx = cacheCanvas.getContext('2d');
      ctx?.drawImage(this.source, 0, 0, cacheCanvas.width, cacheCanvas.height);
      this._inputLimitScale = inputLimitScale;
      this._cacheInputCanvas = cacheCanvas;
    }

    // Handle output canvas size limitations
    if (this._outputLimitSize) {
      let outputLimitScale = 1;
      if (this._outputLimitSize.width) {
        outputLimitScale = Math.min(outputLimitScale, this._outputLimitSize.width / width);
      }
      if (this._outputLimitSize.height) {
        outputLimitScale = Math.min(outputLimitScale, this._outputLimitSize.height / height);
      }
      this._outputLimitScale = outputLimitScale;
    }

    // Retrieve input/output canvases
    let inputCanvas = this._cacheInputCanvas ?? this.source;
    const outputCanvas = this._cacheOutputCanvas ?? null;

    // Clone input canvas when sharing with output
    if (inputCanvas === outputCanvas) {
      console.warn(
        '[Warpvas] Do not use the same canvas as both input and output. This will require creating a copy of the input canvas before each render operation.',
      );
      inputCanvas = this._cloneCanvas(inputCanvas);
    }

    // Assemble configuration parameters
    const options = {
      x: offsetX,
      y: offsetY,
      width,
      height,
      sourceScale: this._inputLimitScale,
      destinationScale: this._outputLimitScale,
    };

    return {
      inputCanvas,
      outputCanvas,
      options,
    };
  }

  /**
   * Retrieve pixel data from input canvas
   *
   * Obtains raw pixel data for rendering calculations in Web Workers.
   *
   * @param caching - Whether to use cached pixel data (default: true)
   *
   * @returns {ImageData} Canvas pixel data object
   */
  private _getInputCanvasImageData(caching = true): ImageData {
    if (caching && this._cacheSourceImageData) return this._cacheSourceImageData;

    const inputCanvas = this._cacheInputCanvas ?? this.source;

    const ctx = inputCanvas.getContext('2d');

    if (!ctx) {
      throw new Error(
        '[Warpvas] Failed to get 2D rendering context. Please ensure that:\n' +
          '1. The inputCanvas is a valid <canvas> element\n' +
          '2. The browser supports Canvas API\n' +
          '3. The canvas has not been tainted by cross-origin content',
      );
    }

    const imageData = ctx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);

    this._cacheSourceImageData = imageData;

    return imageData;
  }

  /**
   * Render warped canvas
   *
   * Generates a new canvas or renders deformed image on specified canvas
   * based on current deformation parameters.
   *
   * @returns {HTMLCanvasElement} Newly created or specified canvas element
   *
   * @throws {Error}
   * - [Warpvas Error] When rendering fails without safe mode
   * - [Warpvas Error] When canvas creation fails
   *
   * @example
   * // Render and append to DOM
   * const canvas = warpvas.render();
   * document.body.appendChild(canvas);
   *
   * @remarks
   * Performance recommendations:
   * 1. For frequent updates, reuse output canvas with setRenderingCanvas
   * 2. For large image deformation, consider:
   *    - Switching to WebGL rendering backend
   *    - Using worker-based async rendering
   *
   * @see setRenderingCanvas Configure reusable canvas
   * @see renderWithWorker Async rendering via Web Worker
   */
  render(): HTMLCanvasElement {
    const { inputCanvas, outputCanvas, options } = this._generateRenderOptions();

    // Use Canvas 2D rendering when safe mode is active
    if (this._safeModeEnabled) {
      return createWarpedCanvas2D(this, inputCanvas, outputCanvas, options);
    }

    const renderMethod = {
      '2d': createWarpedCanvas2D,
      webgl: createWarpedCanvasWebGL,
    }[this.renderingContext];

    try {
      const canvas = renderMethod(this, inputCanvas, outputCanvas, options);
      return canvas;
    } catch (error) {
      // Fallback to Canvas 2D rendering if initial WebGL composition fails under safe mode
      if (this.renderingConfig.enableSafeRendering && this.renderingContext === 'webgl') {
        this._safeModeEnabled = true;
        return createWarpedCanvas2D(this, inputCanvas, outputCanvas, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * Generate warped canvas asynchronously via Web Worker
   *
   * Executes deformation and rendering operations in a separate thread
   * to prevent blocking the main thread.
   *
   * @returns {Promise<HTMLCanvasElement>} Promise resolving to rendered warped canvas
   *
   * @throws {Error}
   * - [Warpvas Error] Failed to create Web Worker
   * - [Warpvas Error] Rendering failed without safe mode
   * - [Warpvas Error] Canvas creation failed
   *
   * @example
   * // Async rendering and awaiting result
   * try {
   *   const canvas = await warpvas.renderWithWorker();
   *   document.body.appendChild(canvas);
   * } catch (error) {
   *   console.error('Rendering failed:', error);
   * }
   *
   * @see setRenderingConfig Configure rendering options
   * @see render Synchronous rendering method
   */
  async renderWithWorker(caching = true): Promise<HTMLCanvasElement> {
    const { outputCanvas, options } = this._generateRenderOptions();

    const imageData = this._getInputCanvasImageData(caching);

    // Use Canvas 2D rendering when safe mode is active
    if (this._safeModeEnabled) {
      return createWorkerWarpedCanvasWebGL(this, imageData, outputCanvas, options);
    }

    const renderMethod = {
      '2d': createWorkerWarpedCanvas2D,
      webgl: createWorkerWarpedCanvasWebGL,
    }[this.renderingContext];

    try {
      return renderMethod(this, imageData, outputCanvas, options);
    } catch (error) {
      // Fallback to Canvas 2D rendering if initial WebGL composition fails under safe mode
      if (this.renderingConfig.enableSafeRendering && this.renderingContext === 'webgl') {
        this._safeModeEnabled = true;
        return createWorkerWarpedCanvasWebGL(this, imageData, outputCanvas, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * Dispose of Warpvas instance
   *
   * Clean up cached resources and references to free memory
   */
  dispose() {
    // Reset configuration flags
    this._safeModeEnabled = false;

    // Clear canvas caches
    if (this._cacheInputCanvas) {
      this._cacheInputCanvas.width = 0;
      this._cacheInputCanvas.height = 0;
      this._cacheInputCanvas = null;
    }
    if (this._cacheOutputCanvas) {
      this._cacheOutputCanvas.width = 0;
      this._cacheOutputCanvas.height = 0;
      this._cacheOutputCanvas = null;
    }

    // Clear image data caches
    this._cacheSourceImageData = null;
    this._cacheSourceSize = null;

    // Reset array references
    this.splitPoints = [];
    this.originalRegions = [];
    this.originalRegionPoints = [];
    this.regionBoundaryCurves = [];
    this.regionCurves = [];
    this.regionPoints = [];
  }
}
