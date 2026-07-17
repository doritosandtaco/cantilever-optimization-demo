export interface InputState {
  L: number;
  H: number;
  t: number;
  nelx: number;
  nely: number;
  E: number; // in MPa
  nu: number;
  density: number;
  yieldStrength: number;
  loadMag: number;
  loadAngle: number;
  loadPosition: number; // relative height on right edge (0 to 1)
  volumeFraction: number;
  penalization: number;
  filterRadius: number;
  moveLimit: number;
  convergenceTolerance: number;
  maxIterations: number;
  minIterations: number;
}

export interface MeshState {
  nelx: number;
  nely: number;
  nnodes: number;
  ndof: number;
  edofMat: Int32Array[];
  nodes: Float64Array[]; // [x, y] coordinates
}

export interface FEAState {
  U: Float64Array;
  compliance: number;
  elementCompliance: Float64Array;
  residual: number;
  iterations: number;
}

export interface FilterState {
  H: Float64Array[]; // Sparse representation can be complex, we'll use a sparse format
  Hs: Float64Array;
  iH: Int32Array;
  jH: Int32Array;
  sH: Float64Array;
}

export interface OptimizationState {
  iteration: number;
  x: Float64Array;
  xPhys: Float64Array;
  change: number;
  complianceHistory: number[];
  volHistory: number[];
  changeHistory: number[];
  residualHistory: number[];
  timeHistory: number[];
  startTime: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'CONVERGED' | 'MAX_ITER_REACHED' | 'ERROR';
  errorMessage?: string;
}
