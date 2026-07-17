import { generateMesh, getBoundaryConditions } from './src/solver/mesh';
import { getElementStiffness } from './src/solver/element';
import { SparseMatrix, dot } from './src/solver/matrixOperator';
import { pcg } from './src/solver/pcg';

const L=300, H=100, t=10, nelx=60, nely=20, E=210000, nu=0.3, load=10000;
const volfrac = 0.4, penal = 3.0, rmin = 1.5;
const mesh = generateMesh(nelx, nely, L, H);
const bc = getBoundaryConditions(mesh, { loadPosition: 0.5, loadAngle: -90, loadMag: load, nelx, nely, L, H, t, E, nu } as any);
const Ke = getElementStiffness(1.0, nu, t, L/nelx/2, H/nely/2); // Pass 1.0!
const x = new Float64Array(nelx*nely).fill(volfrac);
const xPhys = new Float64Array(x);
const K = new SparseMatrix(mesh.edofMat, Ke, xPhys, penal, E, 1e-6*E, mesh.ndof, bc.freeDofs);

const F_free = new Float64Array(bc.freeDofs.length);
for(let i=0; i<bc.freeDofs.length; i++) F_free[i] = bc.F[bc.freeDofs[i]];

const pcgRes = pcg(K, F_free, new Float64Array(bc.freeDofs.length));
const U_free = pcgRes.x;
const U = new Float64Array(mesh.ndof);
for(let i=0; i<bc.freeDofs.length; i++) U[bc.freeDofs[i]] = U_free[i];

let ce = 0;
for (let e = 0; e < x.length; e++) {
  const u = new Float64Array(8);
  for (let i = 0; i < 8; i++) u[i] = U[mesh.edofMat[e][i]];
  let ce_e = 0;
  for (let i = 0; i < 8; i++) {
    let sum = 0;
    for (let j = 0; j < 8; j++) sum += Ke[i * 8 + j] * u[j];
    ce_e += u[i] * sum;
  }
  ce += (1e-6*E + Math.pow(xPhys[e], penal)*(E - 1e-6*E)) * ce_e;
}

const u_load = U[2 * (nelx * (nely + 1) + Math.round(0.5 * nely)) + 1];
console.log({ compliance: ce, deflection: u_load, pcgIters: pcgRes.iterations });
