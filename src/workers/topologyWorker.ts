/// <reference lib="webworker" />
import { InputState, MeshState, FilterState } from '../solver/types';
import { generateMesh, getBoundaryConditions } from '../solver/mesh';
import { getElementStiffness } from '../solver/element';
import { SparseMatrix } from '../solver/matrixOperator';
import { pcg } from '../solver/pcg';
import { setupFilter, applySensitivityFilter } from '../solver/filter';
import { updateDensity } from '../solver/optimalityCriteria';
import { calculateVonMisesStress } from '../solver/stress';

let input: InputState | null = null;
let mesh: MeshState | null = null;
let filter: FilterState | null = null;
let Ke: Float64Array | null = null;
let F: Float64Array | null = null;
let fixedDofs: Int32Array | null = null;
let freeDofs: Int32Array | null = null;
let K_operator: SparseMatrix | null = null;

let x: Float64Array | null = null;
let xPhys: Float64Array | null = null;
let U: Float64Array | null = null;

let iteration = 0;
let change = 1.0;
let complianceHistory: number[] = [];
let volHistory: number[] = [];
let changeHistory: number[] = [];
let residualHistory: number[] = [];
let timeHistory: number[] = [];

let isRunning = false;
let startTime = 0;
let timeAccumulated = 0;

function sendState(status: string, errorMessage?: string) {
  postMessage({
    type: 'STATE_UPDATE',
    payload: {
      iteration,
      x: x ? new Float64Array(x) : null,
      xPhys: xPhys ? new Float64Array(xPhys) : null,
      U: U ? new Float64Array(U) : null,
      change,
      complianceHistory: [...complianceHistory],
      volHistory: [...volHistory],
      changeHistory: [...changeHistory],
      residualHistory: [...residualHistory],
      timeHistory: [...timeHistory],
      status,
      errorMessage,
      mesh: mesh ? { nelx: mesh.nelx, nely: mesh.nely, nnodes: mesh.nnodes, ndof: mesh.ndof } : null,
      vMises: (mesh && input && U && xPhys) ? calculateVonMisesStress(mesh, input, U, xPhys) : null,
    }
  });
}

function init(newInput: InputState) {
  input = newInput;
  iteration = 0;
  change = 1.0;
  complianceHistory = [];
  volHistory = [];
  changeHistory = [];
  residualHistory = [];
  timeHistory = [];
  timeAccumulated = 0;

  mesh = generateMesh(input.nelx, input.nely, input.L, input.H);
  const bc = getBoundaryConditions(mesh, input);
  F = bc.F;
  fixedDofs = bc.fixedDofs;
  freeDofs = bc.freeDofs;

  const a = input.L / input.nelx / 2.0;
  const b = input.H / input.nely / 2.0;
  Ke = getElementStiffness(1.0, input.nu, input.t, a, b);

  filter = setupFilter(input.nelx, input.nely, input.filterRadius);

  const ne = input.nelx * input.nely;
  x = new Float64Array(ne);
  x.fill(input.volumeFraction);
  xPhys = new Float64Array(ne);
  xPhys.fill(input.volumeFraction);
  
  U = new Float64Array(mesh.ndof);

  const Emin = 1e-6 * input.E;
  K_operator = new SparseMatrix(mesh.edofMat, Ke, xPhys, input.penalization, input.E, Emin, mesh.ndof, freeDofs);
  
  sendState('IDLE');
}

function doIteration() {
  if (!input || !mesh || !filter || !Ke || !F || !freeDofs || !K_operator || !x || !xPhys || !U) return false;

  const iterStart = performance.now();
  iteration++;

  // Assembly and solving
  K_operator.updateDensity(xPhys);
  const F_free = new Float64Array(freeDofs.length);
  for (let i = 0; i < freeDofs.length; i++) F_free[i] = F[freeDofs[i]];

  const U_free_0 = new Float64Array(freeDofs.length);
  for (let i = 0; i < freeDofs.length; i++) U_free_0[i] = U[freeDofs[i]];

  const pcgResult = pcg(K_operator, F_free, U_free_0, 1e-5, 2000);
  
  for (let i = 0; i < freeDofs.length; i++) U[freeDofs[i]] = pcgResult.x[i];

  // Objective and sensitivity
  let c = 0;
  const dc = new Float64Array(x.length);
  const Emin = 1e-6 * input.E;

  for (let e = 0; e < x.length; e++) {
    const u = new Float64Array(8);
    for (let i = 0; i < 8; i++) u[i] = U[mesh.edofMat[e][i]];
    
    let ce = 0;
    for (let i = 0; i < 8; i++) {
      let sum = 0;
      for (let j = 0; j < 8; j++) sum += Ke[i * 8 + j] * u[j];
      ce += u[i] * sum;
    }
    
    const E_e = Emin + Math.pow(xPhys[e], input.penalization) * (input.E - Emin);
    c += E_e * ce;
    dc[e] = -input.penalization * Math.pow(xPhys[e], input.penalization - 1) * (input.E - Emin) * ce;
  }

  const dcFiltered = applySensitivityFilter(dc, x, filter);
  
  const updateResult = updateDensity(x, dcFiltered, input.volumeFraction, filter, input.moveLimit);
  x = updateResult.xnew;
  xPhys = updateResult.xPhys;
  change = updateResult.change;

  const iterTime = performance.now() - iterStart;
  timeAccumulated += iterTime;

  let vol = 0;
  for (let i = 0; i < xPhys.length; i++) vol += xPhys[i];
  vol /= xPhys.length;

  complianceHistory.push(c);
  volHistory.push(vol);
  changeHistory.push(change);
  residualHistory.push(pcgResult.residual);
  timeHistory.push(timeAccumulated / 1000.0);

  if (change <= input.convergenceTolerance && iteration >= input.minIterations) {
    return true; // Converged
  }
  if (iteration >= input.maxIterations) {
    return true; // Max iterations
  }
  return false;
}

function runLoop() {
  if (!isRunning) return;
  const done = doIteration();
  
  if (done) {
    isRunning = false;
    sendState(change <= (input?.convergenceTolerance ?? 0.01) ? 'CONVERGED' : 'MAX_ITER_REACHED');
  } else {
    sendState('RUNNING');
    // Yield to let messages be processed and not lock the worker completely
    setTimeout(runLoop, 0);
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  switch (type) {
    case 'INIT':
      init(payload);
      break;
    case 'START':
    case 'RESUME':
      if (!isRunning) {
        isRunning = true;
        startTime = performance.now();
        runLoop();
      }
      break;
    case 'PAUSE':
    case 'STOP':
      isRunning = false;
      sendState('PAUSED');
      break;
    case 'STEP':
      if (!isRunning) {
        const done = doIteration();
        sendState(done ? (change <= (input?.convergenceTolerance ?? 0.01) ? 'CONVERGED' : 'MAX_ITER_REACHED') : 'PAUSED');
      }
      break;
  }
};
