# 검증 및 테스트 계획

## 1. 단위 테스트 (Unit Testing)
- **요소 강성행렬 (Element Stiffness)**: 강체 회전/병진 모드 시 에너지가 0인지, 행렬이 대칭성을 가지는지 테스트.
- **선형 솔버 (PCG Solver)**: 알고 있는 해를 가진 소규모 희소 선형 시스템에 대해 허용 오차 내에서 수렴하는지 확인.
- **단위 변환**: GPa, MPa, mm, m, N 등의 변환 로직 정확성 테스트.
- **SIMP 보간식**: $\rho = 0, 1$ 일 때 각각 $E_{min}$, $E_0$가 정상 도출되는지 확인.

## 2. 통합 수치 검증 (Integration Validation)
- **체적 제약 만족도**: 최적화 종료 후 물리적 밀도의 평균값이 설정된 체적 분율($f_{vol}$)과 오차 $0.005$ 이내로 일치하는지 검증.
- **안정성 검사**: 외력 적용 시 PCG가 정상적으로 해를 찾지 못하거나(예: 잔차 발산) 허용 최대 Iteration에 도달하면 적절한 오류 상태를 반환하는지 확인.
- **비교 검증 (Cross-validation)**: Python 기준 구현체(`python_reference/topopt_cantilever.py`)의 결과(최종 컴플라이언스, 변위 등)와 브라우저 환경 TypeScript 해석 결과가 부동소수점 오차 범위 내에서 유사하게 도출되는지 대조.

## 3. 이론적 검증 (Theoretical Benchmark)
- **Cantilever Beam Deflection**: 초기 Full-density 상태의 FEM 해석 끝단 처짐량 결과를 고체역학 빔 이론(Euler-Bernoulli) 식 $v = \frac{PL^3}{3EI}$ 와 비교. 
  *(단, Q4 요소의 전단 효과(Shear locking 등)로 인해 수%의 오차가 존재할 수 있음을 명시함)*
