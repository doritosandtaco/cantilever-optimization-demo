import { FilterState } from './types';

export function setupFilter(nelx: number, nely: number, rmin: number): FilterState {
  const iH: number[] = [];
  const jH: number[] = [];
  const sH: number[] = [];

  for (let i1 = 0; i1 < nelx; i1++) {
    for (let j1 = 0; j1 < nely; j1++) {
      const e1 = i1 * nely + j1;
      
      const iMin = Math.max(i1 - Math.ceil(rmin), 0);
      const iMax = Math.min(i1 + Math.ceil(rmin) + 1, nelx);
      const jMin = Math.max(j1 - Math.ceil(rmin), 0);
      const jMax = Math.min(j1 + Math.ceil(rmin) + 1, nely);
      
      for (let i2 = iMin; i2 < iMax; i2++) {
        for (let j2 = jMin; j2 < jMax; j2++) {
          const e2 = i2 * nely + j2;
          const dist = Math.sqrt(Math.pow(i1 - i2, 2) + Math.pow(j1 - j2, 2));
          if (dist <= rmin) {
            iH.push(e1);
            jH.push(e2);
            sH.push(rmin - dist);
          }
        }
      }
    }
  }

  const numElements = nelx * nely;
  const Hs = new Float64Array(numElements);
  
  for (let k = 0; k < iH.length; k++) {
    Hs[iH[k]] += sH[k];
  }

  return {
    H: [], // Not fully storing 2D array, just CSR-like lists
    Hs,
    iH: new Int32Array(iH),
    jH: new Int32Array(jH),
    sH: new Float64Array(sH)
  };
}

export function applyFilter(x: Float64Array, filter: FilterState): Float64Array {
  const xPhys = new Float64Array(x.length);
  for (let k = 0; k < filter.iH.length; k++) {
    xPhys[filter.iH[k]] += filter.sH[k] * x[filter.jH[k]];
  }
  for (let i = 0; i < xPhys.length; i++) {
    xPhys[i] /= filter.Hs[i];
  }
  return xPhys;
}

export function applySensitivityFilter(dc: Float64Array, x: Float64Array, filter: FilterState): Float64Array {
  const dcFiltered = new Float64Array(dc.length);
  for (let k = 0; k < filter.iH.length; k++) {
    dcFiltered[filter.iH[k]] += filter.sH[k] * x[filter.jH[k]] * dc[filter.jH[k]];
  }
  for (let i = 0; i < dcFiltered.length; i++) {
    dcFiltered[i] = dcFiltered[i] / filter.Hs[i] / Math.max(1e-3, x[i]);
  }
  return dcFiltered;
}
