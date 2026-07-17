# 수치해석 모델 및 알고리즘

## 1. 유한요소모델 (Finite Element Model)
- **요소 타입**: 2차원 평면응력 (Plane Stress) 가정을 적용한 4절점 사각형 요소 (Q4 Element).
- **자유도**: 각 절점은 x방향($u$)과 y방향($v$)의 2개의 자유도를 가짐.
- **요소 강성행렬 ($K_e$)**: 등방성(Isotropic) 선형탄성 재료의 구성방정식을 기반으로 $8 \times 8$ 행렬을 구성함. 수치적분을 위해 $2 \times 2$ Gauss Quadrature 사용.

## 2. 위상최적화 문제 정식화 (SIMP)
- **목적함수**: 컴플라이언스 최소화 ($c = \mathbf{U}^T \mathbf{K} \mathbf{U}$)
- **제약조건**:
  - $\mathbf{K}(\boldsymbol{\rho}) \mathbf{U} = \mathbf{F}$ (평형 방정식)
  - $\frac{1}{V_0} \sum v_e \rho_e \le f_{vol}$ (체적분율 제약)
  - $0 < \rho_{min} \le \rho_e \le 1$ (밀도 하한계 제약)
- **재료 보간법 (Material Interpolation)**: 
  Solid Isotropic Material with Penalization (SIMP) 방법 사용.
  $$E_e(\rho_e) = E_{min} + \rho_e^p (E_0 - E_{min})$$
  (기본값: $E_{min}/E_0 = 10^{-6}$, $p = 3$)

## 3. 민감도 해석 (Sensitivity Analysis)
목적함수의 밀도 $\rho_e$에 대한 편미분(민감도)은 다음과 같이 계산됨:
$$ \frac{\partial c}{\partial \rho_e} = -p \rho_e^{p-1} (E_0 - E_{min}) \mathbf{u}_e^T \mathbf{k}_0 \mathbf{u}_e $$

## 4. 밀도 필터 (Density Filter)
Checkerboard 패턴 방지 및 Mesh 의존성 완화를 위해 휴리스틱 밀도 필터를 적용함.
- **필터 가중치**: 반경 $r_{min}$ 내의 요소들 간 중심 거리에 비례하는 가중치 적용 ($H_i = \max(0, r_{min} - \text{dist})$).
- 요소 설계변수는 인접 요소들의 가중 평균으로 변환됨.

## 5. 최적화 업데이트 (Optimality Criteria)
라그랑주 승수(Lagrange Multiplier) $\lambda$를 이분법(Bisection method)으로 탐색하며, 다음 규칙에 따라 밀도를 업데이트(이동 한계 $m$ 적용):
$$ \rho_e^{new} = \begin{cases} 
\max(\rho_{min}, \rho_e - m) & \text{if } \rho_e \cdot B_e^{\eta} \le \max(\rho_{min}, \rho_e - m) \\
\min(1, \rho_e + m) & \text{if } \rho_e \cdot B_e^{\eta} \ge \min(1, \rho_e + m) \\
\rho_e \cdot B_e^{\eta} & \text{otherwise}
\end{cases} $$
여기서 $B_e = \frac{-\frac{\partial c}{\partial \rho_e}}{\lambda v_e}$이며, $\eta$는 튜닝 파라미터(보통 0.5).

## 6. 선형 시스템 해법 (Linear Solver)
- 자코비 전처리(Jacobi Preconditioner)가 적용된 켤레기울기법(PCG, Preconditioned Conjugate Gradient) 사용.
- 대규모 전체 행렬 조립을 피하고 요소 단위의 희소행렬 연산을 통해 메모리 효율성을 극대화함.
