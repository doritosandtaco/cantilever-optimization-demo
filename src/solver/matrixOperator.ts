// matrixOperator.ts
// Handles Sparse Matrix Vector Multiplication for assembled global stiffness matrix

export class SparseMatrix {
  // We use a simple element-by-element matrix-vector multiplication 
  // because assembling full CSC/CSR in JS can be memory intensive and slow for Q4.
  // We'll store element stiffness matrices and connectivity.

  edofMat: Int32Array[];
  Ke: Float64Array;
  xPhys: Float64Array;
  penal: number;
  E0: number;
  Emin: number;
  ndof: number;
  freeDofs: Int32Array;

  // Preconditioner (Diagonal)
  diag: Float64Array;

  constructor(edofMat: Int32Array[], Ke: Float64Array, xPhys: Float64Array, penal: number, E0: number, Emin: number, ndof: number, freeDofs: Int32Array) {
    this.edofMat = edofMat;
    this.Ke = Ke;
    this.xPhys = xPhys;
    this.penal = penal;
    this.E0 = E0;
    this.Emin = Emin;
    this.ndof = ndof;
    this.freeDofs = freeDofs;
    this.diag = new Float64Array(freeDofs.length);
    this.computeDiagonal();
  }

  // Update physical density without re-allocating
  updateDensity(xPhys: Float64Array) {
    this.xPhys = xPhys;
    this.computeDiagonal();
  }

  computeDiagonal() {
    this.diag.fill(0);
    const fullDiag = new Float64Array(this.ndof);
    const ne = this.xPhys.length;
    for (let i = 0; i < ne; i++) {
      const E = this.Emin + Math.pow(this.xPhys[i], this.penal) * (this.E0 - this.Emin);
      const edof = this.edofMat[i];
      for (let j = 0; j < 8; j++) {
        fullDiag[edof[j]] += E * this.Ke[j * 8 + j];
      }
    }
    // Extract free DOFs diagonal
    for (let i = 0; i < this.freeDofs.length; i++) {
      this.diag[i] = fullDiag[this.freeDofs[i]];
    }
  }

  // Multiply A * v, only for free DOFs
  multiply(v: Float64Array): Float64Array {
    const fullV = new Float64Array(this.ndof);
    const fullRes = new Float64Array(this.ndof);
    
    // map free to full
    for (let i = 0; i < this.freeDofs.length; i++) {
      fullV[this.freeDofs[i]] = v[i];
    }

    const ne = this.xPhys.length;
    for (let e = 0; e < ne; e++) {
      const E = this.Emin + Math.pow(this.xPhys[e], this.penal) * (this.E0 - this.Emin);
      const edof = this.edofMat[e];
      
      const ve = new Float64Array(8);
      for(let i=0; i<8; i++) ve[i] = fullV[edof[i]];
      
      for(let i=0; i<8; i++) {
        let sum = 0;
        for(let j=0; j<8; j++) {
          sum += this.Ke[i*8 + j] * ve[j];
        }
        fullRes[edof[i]] += sum * E;
      }
    }

    // extract free from full
    const res = new Float64Array(this.freeDofs.length);
    for (let i = 0; i < this.freeDofs.length; i++) {
      res[i] = fullRes[this.freeDofs[i]];
    }
    return res;
  }
}

export function dot(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
