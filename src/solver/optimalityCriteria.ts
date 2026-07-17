import { FilterState } from './types';
import { applyFilter } from './filter';

export function updateDensity(x: Float64Array, dc: Float64Array, volfrac: number, filter: FilterState, moveLimit: number = 0.2): { xnew: Float64Array, xPhys: Float64Array, change: number } {
  let l1 = 0;
  let l2 = 1e9;
  let xnew = new Float64Array(x.length);
  let xPhys = new Float64Array(x.length);
  
  while ((l2 - l1) > 1e-4) {
    const lmid = 0.5 * (l2 + l1);
    
    for (let i = 0; i < x.length; i++) {
      const B = Math.sqrt(Math.max(-dc[i] / lmid, 0));
      let val = x[i] * B;
      
      const lowerBound = Math.max(0.001, x[i] - moveLimit);
      const upperBound = Math.min(1.0, x[i] + moveLimit);
      
      xnew[i] = Math.max(lowerBound, Math.min(upperBound, val));
    }
    
    xPhys = applyFilter(xnew, filter);
    
    let vol = 0;
    for (let i = 0; i < xPhys.length; i++) vol += xPhys[i];
    vol /= xPhys.length;
    
    if (vol > volfrac) {
      l1 = lmid;
    } else {
      l2 = lmid;
    }
  }
  
  let change = 0;
  for (let i = 0; i < x.length; i++) {
    const diff = Math.abs(xnew[i] - x[i]);
    if (diff > change) change = diff;
  }
  
  return { xnew, xPhys, change };
}
