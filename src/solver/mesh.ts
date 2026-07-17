import { MeshState, InputState } from './types';

export function generateMesh(nelx: number, nely: number, L: number, H: number): MeshState {
  const nnodes = (nelx + 1) * (nely + 1);
  const ndof = 2 * nnodes;
  const edofMat: Int32Array[] = [];
  const nodes: Float64Array[] = [];

  const dx = L / nelx;
  const dy = H / nely;

  for (let i = 0; i <= nelx; i++) {
    for (let j = 0; j <= nely; j++) {
      nodes.push(new Float64Array([i * dx, j * dy]));
    }
  }

  for (let elx = 0; elx < nelx; elx++) {
    for (let ely = 0; ely < nely; ely++) {
      const n1 = (nely + 1) * elx + ely;
      const n2 = (nely + 1) * (elx + 1) + ely;
      edofMat.push(new Int32Array([
        2 * n1, 2 * n1 + 1,
        2 * n2, 2 * n2 + 1,
        2 * n2 + 2, 2 * n2 + 3,
        2 * n1 + 2, 2 * n1 + 3
      ]));
    }
  }

  return { nelx, nely, nnodes, ndof, edofMat, nodes };
}

export function getBoundaryConditions(mesh: MeshState, input: InputState): { fixedDofs: Int32Array, freeDofs: Int32Array, F: Float64Array } {
  const { nelx, nely, ndof } = mesh;
  const F = new Float64Array(ndof);
  
  // Apply load
  const loadNodeY = Math.round(input.loadPosition * nely);
  const loadNode = nelx * (nely + 1) + loadNodeY;
  
  const rad = input.loadAngle * Math.PI / 180;
  F[2 * loadNode] = input.loadMag * Math.cos(rad);
  F[2 * loadNode + 1] = input.loadMag * Math.sin(rad);

  // Apply fixed boundary conditions on the left edge (x=0)
  const fixedDofsArr: number[] = [];
  for (let i = 0; i <= nely; i++) {
    fixedDofsArr.push(2 * i, 2 * i + 1);
  }
  
  const fixedDofs = new Int32Array(fixedDofsArr);
  const freeDofsArr: number[] = [];
  
  const isFixed = new Uint8Array(ndof);
  for (let i = 0; i < fixedDofs.length; i++) {
    isFixed[fixedDofs[i]] = 1;
  }
  
  for (let i = 0; i < ndof; i++) {
    if (!isFixed[i]) freeDofsArr.push(i);
  }
  
  const freeDofs = new Int32Array(freeDofsArr);
  
  return { fixedDofs, freeDofs, F };
}
