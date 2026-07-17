import { InputState, MeshState } from './types';
import { getBoundaryConditions } from './mesh';

export function validateInputs(input: InputState): string[] {
  const errors: string[] = [];
  if (input.nelx * input.nely > 5000) errors.push("요소 수가 5,000개를 초과했습니다. 브라우저 성능이 저하될 수 있습니다.");
  if (input.volumeFraction <= 0 || input.volumeFraction >= 1) errors.push("체적분율은 0과 1 사이여야 합니다.");
  if (input.E <= 0) errors.push("Young's modulus는 양수여야 합니다.");
  if (input.nu <= -1 || input.nu >= 0.5) errors.push("Poisson's ratio는 -1 초과, 0.5 미만이어야 합니다.");
  return errors;
}

export function validateMeshAndBC(mesh: MeshState, input: InputState): string[] {
  const errors: string[] = [];
  const { fixedDofs, F } = getBoundaryConditions(mesh, input);
  
  if (fixedDofs.length === 0) errors.push("고정된 자유도가 없습니다. 강체 거동이 발생합니다.");
  
  let hasLoad = false;
  let allLoadsFixed = true;
  
  const isFixed = new Uint8Array(mesh.ndof);
  for (let i = 0; i < fixedDofs.length; i++) isFixed[fixedDofs[i]] = 1;

  for (let i = 0; i < F.length; i++) {
    if (Math.abs(F[i]) > 1e-8) {
      hasLoad = true;
      if (!isFixed[i]) {
        allLoadsFixed = false;
      }
    }
  }
  
  if (!hasLoad) errors.push("작용하는 하중이 없습니다.");
  if (hasLoad && allLoadsFixed) errors.push("모든 하중이 고정된 자유도에 작용하여 변위가 발생하지 않습니다.");
  
  return errors;
}
