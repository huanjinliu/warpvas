import type { Warpvas } from '../warpvas.class';

/**
 * Create warped canvas instance using WebGL in WebWorker
 *
 * @param warpvas - Warpvas instance containing deformation configuration
 * @param source - Source image canvas element
 * @param destination - Target canvas (creates new canvas if null)
 * @param options - Rendering configuration parameters
 *
 * @returns Created warped canvas instance using WebGL in WebWorker
 */
export const createWarpedCanvas = <Canvas extends HTMLCanvasElement | OffscreenCanvas>(
  warpvas: Warpvas,
  source: HTMLCanvasElement | ImageData,
  destination: Canvas,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceScale?: number;
    destinationScale?: number;
  },
) => {
  const { x, y, width, height, sourceScale = 1 } = options;
  const {
    enableAntialias = true,
    gridColor = { r: 255, g: 0, b: 0, a: 1 },
    enableContentDisplay = true,
    enableGridDisplay = false,
    enableGridVertexDisplay = false,
  } = warpvas.renderingConfig ?? {};
  const { width: originWidth, height: originHeight } = source;

  const gl = destination.getContext('webgl', { antialias: enableAntialias });
  if (!gl) {
    throw Error('[Warpvas] Failed to initialize WebGL. Your browser or device may not support it.');
  }

  const vertexs: {
    before: Coord[];
    after: Coord[];
  } = {
    before: [],
    after: [],
  };

  // Draw all triangle primitives
  warpvas.regionPoints.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      const points = col;
      const columns = warpvas.regionCurves[rowIndex][colIndex].vertical.length - 1;
      points.forEach((_, i) => {
        // Get four points of the quadrilateral
        const a = points[i];
        const b = points[i + 1];
        const c = points[i + columns + 2];
        const d = points[i + columns + 1];

        // Get original quadrilateral points
        const a0 = warpvas.originalRegionPoints[rowIndex][colIndex][i];
        const b0 = warpvas.originalRegionPoints[rowIndex][colIndex][i + 1];
        const c0 = warpvas.originalRegionPoints[rowIndex][colIndex][i + columns + 2];
        const d0 = warpvas.originalRegionPoints[rowIndex][colIndex][i + columns + 1];

        if (b && c && i % (columns + 1) < columns) {
          vertexs.before.push(a0, b0, d0, c0, b0, d0);
          vertexs.after.push(a, b, d, c, b, d);
        }
      });
    });
  });

  // Vertex shader program
  const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      varying highp vec2 vTextureCoord;
      void main(void) {
          gl_Position = aVertexPosition;
          gl_PointSize = 2.0;
          vTextureCoord = aTextureCoord;
      }
  `;

  // Fragment shader program
  const fsSource = `
      varying highp vec2 vTextureCoord;
      uniform sampler2D uSampler;
      void main(void) {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
      }
  `;

  /**
   * Load and compile shader program
   *
   * @param type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @param source - Shader source code
   * @returns {WebGLShader | null} Compiled shader object, null on failure
   */
  const loadShader = (type: GLenum, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('[Warpvas] Failed to create shader.');
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[Warpvas] Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  /**
   * Initialize WebGL shader program
   *
   * @param _vsSource - Vertex shader source code
   * @param _fsSource - Fragment shader source code
   * @returns {WebGLProgram | null} Linked shader program, null on failure
   */
  const initShaderProgram = (_vsSource: string, _fsSource: string) => {
    const vertexShader = loadShader(gl.VERTEX_SHADER, _vsSource);
    if (!vertexShader) {
      console.error('[Warpvas] Failed to initialize vertex shader.');
      return null;
    }

    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, _fsSource);
    if (!fragmentShader) {
      console.error('[Warpvas] Failed to initialize fragment shader.');
      return null;
    }

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
      console.error('[Warpvas] Failed to create shader program.');
      return null;
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('[Warpvas] Shader program linking error:', gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  };

  /**
   * Initialize vertex and texture coordinate buffers
   *
   * Creates and populates the following buffers:
   * 1. Texture coordinate buffer: Stores image mapping coordinates
   * 2. Vertex position buffer: Stores triangle vertex positions
   *
   * @returns {{
   *   position: WebGLBuffer | null,
   *   textureCoord: WebGLBuffer | null
   * }} Buffer objects
   */
  const initBuffers = () => {
    // Define texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    const textureCoordinates = vertexs.before
      .map((i, idx) => {
        const list = [i.x / (originWidth / sourceScale), i.y / (originHeight / sourceScale)];
        if ((idx + 1) % 3 === 0) {
          list.push(
            vertexs.before[idx - 2].x / (originWidth / sourceScale),
            vertexs.before[idx - 2].y / (originHeight / sourceScale),
          );
        } else {
          list.push(
            vertexs.before[idx + 1].x / (originWidth / sourceScale),
            vertexs.before[idx + 1].y / (originHeight / sourceScale),
          );
        }
        return list;
      })
      .flat(1);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    // Define vertex positions for GL triangles
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = vertexs.after
      .map((i, idx) => {
        const list = [(i.x + x) / (width / 2) - 1, -((i.y + y) / (height / 2) - 1)];
        if ((idx + 1) % 3 === 0) {
          list.push(
            (vertexs.after[idx - 2].x + x) / (width / 2) - 1,
            -((vertexs.after[idx - 2].y + y) / (height / 2) - 1),
          );
        } else {
          list.push(
            (vertexs.after[idx + 1].x + x) / (width / 2) - 1,
            -((vertexs.after[idx + 1].y + y) / (height / 2) - 1),
          );
        }
        return list;
      })
      .flat(1);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
    };
  };

  /**
   * Render scene
   *
   * @param programInfo - Shader program information
   * @param buffers - Vertex and texture coordinate buffers
   * @param texture - WebGL texture object
   */
  const drawScene = (
    programInfo: {
      program: WebGLProgram | null;
      attribLocations: {
        vertexPosition: number;
        textureCoord: number;
      };
      uniformLocations: {
        uSampler: WebGLUniformLocation | null;
      };
    },
    buffers: {
      position: WebGLBuffer | null;
      textureCoord: WebGLBuffer | null;
    },
    texture: WebGLTexture,
  ) => {
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // Set background color to transparent
    gl.clear(gl.COLOR_BUFFER_BIT);

    const numComponents = 2; // Extract two values per iteration
    const type = gl.FLOAT; // Data type
    const normalize = false; // No normalization
    const stride = 4 * Float32Array.BYTES_PER_ELEMENT; // Offset between data blocks
    const offset = 0; // Offset from buffer start
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      2,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

    gl.useProgram(programInfo.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    if (enableContentDisplay) gl.drawArrays(gl.TRIANGLES, 0, vertexs.before.length);

    // Fragment shader program (for outlining)
    const { r, g, b, a } = gridColor;
    const rgba =
      `${(r / 255).toFixed(1)}, ` +
      `${(g / 255).toFixed(1)}, ` +
      `${(b / 255).toFixed(1)}, ` +
      `${a.toFixed(1)}`;
    const fsSourceOutline = `
      void main(void) {
        gl_FragColor = vec4(${rgba});
      }
    `;
    // Initialize shader program
    const shaderProgramOutline = initShaderProgram(vsSource, fsSourceOutline);
    if (!shaderProgramOutline) {
      throw Error('[Warpvas] Failed to initialize outline shader program.');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      gl.getAttribLocation(shaderProgramOutline, 'aVertexPosition'),
      2,
      type,
      normalize,
      0,
      offset,
    );
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgramOutline, 'aVertexPosition'));

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      gl.getAttribLocation(shaderProgramOutline, 'aTextureCoord'),
      2,
      type,
      normalize,
      0,
      offset,
    );
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgramOutline, 'aTextureCoord'));

    gl.useProgram(shaderProgramOutline);
    if (enableGridDisplay) gl.drawArrays(gl.LINES, 0, vertexs.before.length * 2);
    if (enableGridVertexDisplay) gl.drawArrays(gl.POINTS, 0, vertexs.before.length * 2);
  };

  /**
   * Check if a number is power of two
   *
   * Used to determine if texture dimensions are suitable for mipmap generation
   *
   * @param value - Number to check
   * @returns {boolean} True if the value is power of two
   */
  const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;

  const shaderProgram = initShaderProgram(vsSource, fsSource);
  if (!shaderProgram) {
    throw Error('[Warpvas] Failed to initialize shader program.');
  }

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  const glTexture = gl.createTexture();
  if (!glTexture) {
    throw Error('[Warpvas] Failed to create WebGL texture object.');
  }
  gl.bindTexture(gl.TEXTURE_2D, glTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  if (isPowerOf2(source.width) && isPowerOf2(source.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.viewport(0, 0, destination.width, destination.height);

  // Draw all triangle primitives
  const buffers = initBuffers();
  drawScene(programInfo, buffers, glTexture);

  return destination;
};

/**
 * Convenience method for creating and rendering warped canvas.
 *
 * @param warpvas - Texture object containing deformation grid and rendering options
 * @param source - Source image canvas
 * @param destination - Target render canvas (creates new canvas if null)
 * @param options - Rendering configuration options
 *
 * @returns {HTMLCanvasElement} Rendered canvas object
 */
const createWarpedCanvasWebGL = (
  warpvas: Warpvas,
  source: HTMLCanvasElement,
  destination: HTMLCanvasElement | null,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceScale?: number;
    destinationScale?: number;
  },
) => {
  const { width, height, sourceScale = 1, destinationScale = 1 } = options;

  destination = destination ?? document.createElement('canvas');
  destination.width = width * destinationScale * sourceScale;
  destination.height = height * destinationScale * sourceScale;

  const canvas = createWarpedCanvas(warpvas, source, destination, options);

  return canvas;
};

export default createWarpedCanvasWebGL;
