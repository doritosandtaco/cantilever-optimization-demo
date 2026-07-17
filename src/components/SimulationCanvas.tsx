import React, { useRef, useEffect, useState } from 'react';

interface Props {
  xPhys: Float64Array | null;
  U: Float64Array | null;
  vMises: Float64Array | null;
  meshInfo: any;
  input: any;
  viewMode: 'density' | 'displacement' | 'stress' | 'mesh';
  densityThreshold: number;
}

export function SimulationCanvas({ xPhys, U, vMises, meshInfo, input, viewMode, densityThreshold }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 200 });

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !meshInfo) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size.width, size.height);
    
    const { nelx, nely } = meshInfo;
    const padX = 20;
    const padY = 20;
    
    // Calculate scale to fit
    const aspectMesh = input.L / input.H;
    const aspectCanvas = (size.width - 2 * padX) / (size.height - 2 * padY);
    
    let scaleX, scaleY;
    if (aspectMesh > aspectCanvas) {
      scaleX = (size.width - 2 * padX) / input.L;
      scaleY = scaleX;
    } else {
      scaleY = (size.height - 2 * padY) / input.H;
      scaleX = scaleY;
    }

    const offsetX = (size.width - input.L * scaleX) / 2;
    const offsetY = (size.height - input.H * scaleY) / 2;

    const dx = (input.L * scaleX) / nelx;
    const dy = (input.H * scaleY) / nely;

    if (viewMode === 'density' && xPhys) {
      for (let elx = 0; elx < nelx; elx++) {
        for (let ely = 0; ely < nely; ely++) {
          const e = elx * nely + ely;
          const rho = xPhys[e];
          if (rho >= densityThreshold) {
            // grayscale
            const c = Math.floor(255 * (1 - rho));
            ctx.fillStyle = `rgb(${c},${c},${c})`;
            ctx.fillRect(offsetX + elx * dx, offsetY + ely * dy, dx + 0.5, dy + 0.5);
          }
        }
      }
    } else if (viewMode === 'stress' && vMises && xPhys) {
       // max stress
       let maxS = 0;
       for(let i=0; i<vMises.length; i++) if (vMises[i] > maxS) maxS = vMises[i];
       
       for (let elx = 0; elx < nelx; elx++) {
        for (let ely = 0; ely < nely; ely++) {
          const e = elx * nely + ely;
          if (xPhys[e] >= densityThreshold) {
            const s = vMises[e];
            const ratio = maxS > 0 ? s / maxS : 0;
            // turbo-like colormap simplified
            const h = (1.0 - ratio) * 240;
            ctx.fillStyle = `hsl(${h}, 100%, 50%)`;
            ctx.fillRect(offsetX + elx * dx, offsetY + ely * dy, dx + 0.5, dy + 0.5);
          }
        }
      }
    }

  }, [xPhys, U, vMises, meshInfo, input, viewMode, size, densityThreshold]);

  return (
    <div className="w-full h-full min-h-[300px] bg-white border rounded shadow-sm relative flex flex-col" ref={containerRef}>
      {viewMode === 'stress' && (
        <div className="absolute top-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
          ⚠️ 응력은 후처리 결과이며 응력제약 최적화가 아님
        </div>
      )}
      <canvas 
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="block flex-1 w-full h-full"
      />
    </div>
  );
}
