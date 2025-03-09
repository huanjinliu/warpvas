import { createAssistWorker } from 'assist-worker';
import type { Warpvas } from '../warpvas.class';
import { createWarpedCanvas } from './webgl';

/**
 * Create warped canvas using WebGL in Web Worker
 *
 * Executes canvas rendering in background thread via Web Worker and WebGL to prevent main thread blocking and improve performance.
 *
 * @param warpvas - Warpvas instance containing deformation grid and rendering options
 * @param imageData - Source image data
 * @param destination - Target render canvas (creates new canvas if null)
 * @param options - Rendering configuration options
 *
 * @returns {Promise<HTMLCanvasElement>} Rendered canvas object
 */
const createWorkerWarpedCanvasWebGL = async (
  warpvas: Warpvas,
  imageData: ImageData,
  destination: HTMLCanvasElement | null,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceScale?: number;
    destinationScale?: number;
  },
): Promise<HTMLCanvasElement> => {
  const { regionPoints, renderingConfig, regionCurves, originalRegionPoints } = warpvas;
  const warpvasLike = {
    renderingConfig,
    regionCurves: regionCurves.map((i) =>
      i.map((j) => ({
        horizontal: { length: j.horizontal.length },
        vertical: { length: j.vertical.length },
      })),
    ),
    regionPoints,
    originalRegionPoints,
  };

  const worker = createAssistWorker()
    .collect({ warpvas: warpvasLike, options, createWarpedCanvas })
    .create((imageData, { collections }) => {
      const { options, warpvas, createWarpedCanvas } = collections;
      const { width, height, sourceScale = 1, destinationScale = 1 } = options;

      const _width = width * destinationScale * sourceScale;
      const _height = height * destinationScale * sourceScale;
      const destination = new OffscreenCanvas(_width, _height);

      const canvas = createWarpedCanvas(warpvas, imageData, destination, options);

      const imageBitmap = canvas.transferToImageBitmap();

      return imageBitmap;
    });

  const imageBitmap = await worker.run(imageData);
  worker.terminate();

  destination = destination ?? document.createElement('canvas');
  destination.width = imageBitmap.width;
  destination.height = imageBitmap.height;
  destination!.getContext('2d')!.drawImage(imageBitmap, 0, 0);

  return destination;
};

export default createWorkerWarpedCanvasWebGL;
