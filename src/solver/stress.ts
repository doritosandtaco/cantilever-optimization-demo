import { MeshState, InputState } from './types';

// For Q4, stress at the center of the element (xi=0, eta=0)
export function calculateVonMisesStress(mesh: MeshState, input: InputState, U: Float64Array, xPhys: Float64Array, densityThreshold: number = 0.1): Float64Array {
  const { nelx, nely, edofMat } = mesh;
  const { E, nu, L, H } = input;
  const a = L / nelx / 2.0;
  const b = H / nely / 2.0;
  
  const vMises = new Float64Array(nelx * nely);
  
  // D matrix for plane stress
  const coef = E / (1 - nu * nu);
  const D = [
    [coef, coef * nu, 0],
    [coef * nu, coef, 0],
    [0, 0, coef * (1 - nu) / 2]
  ];
  
  // At center xi=0, eta=0
  const invJ = [[1 / a, 0], [0, 1 / b]];
  const dN_dxi = [-0.25, 0.25, 0.25, -0.25];
  const dN_deta = [-0.25, -0.25, 0.25, 0.25];
  
  const dN_dx = dN_dxi.map((v, i) => invJ[0][0] * v + invJ[0][1] * dN_deta[i]);
  const dN_dy = dN_dxi.map((v, i) => invJ[1][0] * v + invJ[1][1] * dN_deta[i]);
  
  const B = new Float64Array(3 * 8);
  for (let i = 0; i < 4; i++) {
    B[0 * 8 + 2 * i] = dN_dx[i];
    B[1 * 8 + 2 * i + 1] = dN_dy[i];
    B[2 * 8 + 2 * i] = dN_dy[i];
    B[2 * 8 + 2 * i + 1] = dN_dx[i];
  }
  
  for (let e = 0; e < nelx * nely; e++) {
    if (xPhys[e] < densityThreshold) {
      vMises[e] = 0;
      continue;
    }
    
    const u = new Float64Array(8);
    for (let i = 0; i < 8; i++) {
      u[i] = U[edofMat[e][i]];
    }
    
    // strain = B * u
    const strain = new Float64Array(3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        strain[r] += B[r * 8 + c] * u[c];
      }
    }
    
    // stress = D * strain
    const stress = new Float64Array(3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        stress[r] += D[r][c] * strain[c];
      }
    }
    
    // Principal stresses for Von Mises (sigma_x, sigma_y, tau_xy)
    const sx = stress[0];
    const sy = stress[1];
    const txy = stress[2];
    
    vMises[e] = Math.sqrt(sx*sx - sx*sy + sy*sy + 3*txy*txy) * xPhys[e]; // Penalize stress for visual clarity in low density
  }
  
  return vMises;
}
