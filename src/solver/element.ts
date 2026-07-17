export function getElementStiffness(E: number, nu: number, t: number, a: number, b: number): Float64Array {
  // 8x8 element stiffness matrix for a 2a x 2b rectangular plane stress Q4 element
  const Ke = new Float64Array(64);
  const pts = [-1 / Math.sqrt(3), 1 / Math.sqrt(3)];
  
  const D = [
    [1, nu, 0],
    [nu, 1, 0],
    [0, 0, (1 - nu) / 2]
  ].map(row => row.map(v => v * E / (1 - nu * nu)));

  for (let xi of pts) {
    for (let eta of pts) {
      const dN_dxi = [-(1 - eta) / 4, (1 - eta) / 4, (1 + eta) / 4, -(1 + eta) / 4];
      const dN_deta = [-(1 - xi) / 4, -(1 + xi) / 4, (1 + xi) / 4, (1 - xi) / 4];
      
      const detJ = a * b; // Jacobian determinant for rectangular element
      const invJ = [[1 / a, 0], [0, 1 / b]];
      
      const dN_dx = dN_dxi.map((v, i) => invJ[0][0] * v + invJ[0][1] * dN_deta[i]);
      const dN_dy = dN_dxi.map((v, i) => invJ[1][0] * v + invJ[1][1] * dN_deta[i]);
      
      const B = new Float64Array(3 * 8); // 3 rows, 8 cols
      for (let i = 0; i < 4; i++) {
        B[0 * 8 + 2 * i] = dN_dx[i];
        B[1 * 8 + 2 * i + 1] = dN_dy[i];
        B[2 * 8 + 2 * i] = dN_dy[i];
        B[2 * 8 + 2 * i + 1] = dN_dx[i];
      }
      
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          let val = 0;
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              val += B[r * 8 + i] * D[r][c] * B[c * 8 + j];
            }
          }
          Ke[i * 8 + j] += val * detJ * t;
        }
      }
    }
  }
  return Ke;
}
