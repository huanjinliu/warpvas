import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { fabric } from 'fabric';
import useMarkDown from 'docs/hooks/use-mark-down';
import { loadFont } from 'docs/utils';
import styles from './style.less';

export interface NotePaperProps extends React.HTMLAttributes<HTMLDivElement> {
  paperLink: string;
  active: boolean;
}

const NotePaper: React.FC<NotePaperProps> = ({ className, style, paperLink, active, ...rest }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [content] = useMarkDown(paperLink);

  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  const registerDragEvent = useCallback((canvas: fabric.Canvas, handler: fabric.Object) => {
    let dragging = false;
    canvas.on('mouse:down', (e) => {
      if (e.target === handler) dragging = true;
    });
    canvas.on('mouse:move', (e) => {
      if (dragging) {
        setTranslate((pre) => ({
          x: pre.x + e.e.movementX,
          y: pre.y + e.e.movementY,
        }));
      }
    });
    canvas.on('mouse:up', (e) => {
      dragging = false;
    });
  }, []);

  const initPaperCanvas = useCallback(async () => {
    if (!content) return;
    if (!canvasRef.current) return;

    await loadFont('handwriting');

    const canvas = canvasRef.current;
    const fabricCanvas = new fabric.Canvas(canvas, {
      width: 400,
      height: 350,
      selection: false,
      hoverCursor: 'default',
    });
    const topBar = new fabric.Rect({
      width: fabricCanvas.getWidth(),
      height: 60,
      fill: 'transparent',
      selectable: false,
      originX: 'left',
      originY: 'top',
    });
    const textbox = new fabric.Textbox(content, {
      width: 1000,
      left: 20,
      top: topBar.getScaledHeight() + 10,
      lineHeight: 1.8,
      fontSize: 14,
      fontFamily: 'handwriting',
      fill: '#333',
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false,
      hasControls: false,
      selectionColor: 'rgba(132, 131, 124, 0.2)',
    });
    const scale = Math.min(
      1,
      (fabricCanvas.getHeight() - topBar.getScaledHeight() - 20) / textbox.getScaledHeight(),
    );
    textbox.scale(scale);
    fabricCanvas.add(topBar, textbox);
    fabricCanvas.requestRenderAll();

    registerDragEvent(fabricCanvas, topBar);

    setLoading(false);
  }, [content]);

  useEffect(() => {
    initPaperCanvas();
  }, [initPaperCanvas]);

  return (
    <div
      className={classnames(styles.notePaper, className)}
      style={{
        ...style,
        background: active
          ? 'linear-gradient(to bottom, rgba(248, 232, 82, 1) 45px, rgba(250, 243, 155, 1) 60px)'
          : 'linear-gradient(to bottom, rgba(213, 213, 213, 1) 45px, rgba(235, 235, 235, 1) 60px)',
        transform: `translate3d(${translate.x}px, ${translate.y}px, 0)`,
        filter: active ? 'drop-shadow(2px 2px 10px rgba(0, 0, 0, 0.08))' : 'unset',
      }}
      {...rest}
    >
      {loading && <span>loading...</span>}
      <div style={{ display: loading ? 'none' : 'block' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default NotePaper;
