import { OptimizationState, InputState } from '../solver/types';

export function exportJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(state: OptimizationState, filename: string) {
  const { complianceHistory, volHistory, changeHistory, residualHistory, timeHistory } = state;
  let csv = 'Iteration,Compliance,VolumeFraction,MaxDensityChange,Residual,Time_s\n';
  
  for (let i = 0; i < complianceHistory.length; i++) {
    csv += `${i + 1},${complianceHistory[i]},${volHistory[i]},${changeHistory[i]},${residualHistory[i]},${timeHistory[i]}\n`;
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPNG(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
