import { getElementStiffness } from '../src/solver/element';
import { generateMesh } from '../src/solver/mesh';
import { SparseMatrix, dot } from '../src/solver/matrixOperator';

function testElementSymmetry() {
  const Ke = getElementStiffness(210000, 0.3, 10, 5, 5);
  let symmetric = true;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (Math.abs(Ke[i*8 + j] - Ke[j*8 + i]) > 1e-10) {
        symmetric = false;
      }
    }
  }
  if (!symmetric) throw new Error("Element stiffness matrix is not symmetric!");
  console.log("Element symmetry test passed.");
}

function testMeshGeneration() {
  const mesh = generateMesh(10, 5, 100, 50);
  if (mesh.nnodes !== (11 * 6)) throw new Error("Incorrect number of nodes.");
  if (mesh.ndof !== 2 * 66) throw new Error("Incorrect number of DOFs.");
  console.log("Mesh generation test passed.");
}

testElementSymmetry();
testMeshGeneration();
console.log("All unit tests passed.");
