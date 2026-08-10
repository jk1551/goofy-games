import { useEffect, useRef, useState } from "react";

export function DrawingCanvas({ onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const strokesRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    resizeCanvas(canvasRef.current);
    const handleResize = () => {
      resizeCanvas(canvasRef.current);
      redraw(canvasRef.current, strokesRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const beginStroke = (event) => {
    const canvas = canvasRef.current;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(canvas, event);
    strokesRef.current.push([lastPointRef.current]);
  };

  const continueStroke = (event) => {
    if (!drawingRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const point = getPoint(canvas, event);
    const stroke = strokesRef.current.at(-1);
    stroke.push(point);
    drawSegment(canvas, lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const endStroke = () => {
    if (!drawingRef.current) {
      return;
    }
    drawingRef.current = false;
    lastPointRef.current = null;
    setCanUndo(strokesRef.current.length > 0);
    onChange?.(strokesRef.current);
  };

  const undo = () => {
    strokesRef.current.pop();
    redraw(canvasRef.current, strokesRef.current);
    setCanUndo(strokesRef.current.length > 0);
    onChange?.(strokesRef.current);
  };

  return (
    <div className="drawing-pad">
      <canvas
        ref={canvasRef}
        onPointerDown={beginStroke}
        onPointerMove={continueStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      />
      <button type="button" className="button button--ghost" onClick={undo} disabled={!canUndo}>Undo</button>
    </div>
  );
}

function resizeCanvas(canvas) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
}

function getPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height
  };
}

function drawSegment(canvas, from, to) {
  const context = canvas.getContext("2d");
  context.strokeStyle = "#17131f";
  context.lineWidth = 6 * (window.devicePixelRatio || 1);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(from.x * canvas.width, from.y * canvas.height);
  context.lineTo(to.x * canvas.width, to.y * canvas.height);
  context.stroke();
}

function redraw(canvas, strokes) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    for (let index = 1; index < stroke.length; index += 1) {
      drawSegment(canvas, stroke[index - 1], stroke[index]);
    }
  }
}
