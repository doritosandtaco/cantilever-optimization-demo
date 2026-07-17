import { SparseMatrix, dot } from './matrixOperator';

export interface PCGResult {
  x: Float64Array;
  iterations: number;
  residual: number;
}

export function pcg(A: SparseMatrix, b: Float64Array, x0: Float64Array, tol: number = 1e-5, maxIter: number = 2000): PCGResult {
  const n = b.length;
  const x = new Float64Array(x0);
  
  // r = b - A * x
  const Ax = A.multiply(x);
  const r = new Float64Array(n);
  let rNorm2 = 0;
  const bNorm2 = dot(b, b);
  
  for (let i = 0; i < n; i++) {
    r[i] = b[i] - Ax[i];
    rNorm2 += r[i] * r[i];
  }

  if (bNorm2 === 0) {
    return { x: new Float64Array(n), iterations: 0, residual: 0 };
  }

  const bNorm = Math.sqrt(bNorm2);
  let relativeResidual = Math.sqrt(rNorm2) / bNorm;
  
  if (relativeResidual < tol) {
    return { x, iterations: 0, residual: relativeResidual };
  }

  // Preconditioner z = M^-1 * r
  const z = new Float64Array(n);
  for (let i = 0; i < n; i++) z[i] = r[i] / A.diag[i];

  let p = new Float64Array(z);
  let rz = dot(r, z);

  let iter = 0;
  while (iter < maxIter) {
    const Ap = A.multiply(p);
    const pAp = dot(p, Ap);
    
    if (pAp === 0) break;

    const alpha = rz / pAp;

    rNorm2 = 0;
    for (let i = 0; i < n; i++) {
      x[i] += alpha * p[i];
      r[i] -= alpha * Ap[i];
      rNorm2 += r[i] * r[i];
    }

    relativeResidual = Math.sqrt(rNorm2) / bNorm;
    if (relativeResidual < tol) {
      break;
    }

    for (let i = 0; i < n; i++) z[i] = r[i] / A.diag[i];
    
    const rzNew = dot(r, z);
    const beta = rzNew / rz;
    rz = rzNew;

    for (let i = 0; i < n; i++) {
      p[i] = z[i] + beta * p[i];
    }
    
    iter++;
  }

  return { x, iterations: iter, residual: relativeResidual };
}
