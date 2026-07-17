# Structure & Protection Topology Lab

Cantilever Beam 위상최적화 및 AI 코딩 실습을 위한 웹 애플리케이션입니다.

## 주요 기능
- 브라우저 기반 실시간 2D 위상최적화(SIMP) 연산
- 변위, 밀도, 응력 결과 시각화
- 반복(Iteration) 별 주요 결과 그래프 제공
- Python 기준 코드 제공 및 교차 검증 가능
- Web Worker를 이용한 백그라운드 비동기 연산

## 실행 방법

### 1. Google AI Studio 웹 미리보기
우측 상단의 "Preview" 버튼을 눌러 내장된 브라우저에서 바로 실행할 수 있습니다.
- 초기 입력값은 기본적으로 최적화가 가능한 상태로 설정되어 있습니다.
- "최적화 실행" 버튼을 누르면 연산이 시작됩니다.

### 2. Python 기준 코드 실행
로컬 환경에서 Python 코드를 실행하여 결과를 교차 검증할 수 있습니다.
\`\`\`bash
cd python_reference
pip install -r requirements.txt
python topopt_cantilever.py
\`\`\`

## 수치 검증
- 초기 Volume Fraction 및 컴플라이언스
- PCG 솔버의 잔차(Residual)
- OC 업데이트로 인한 최대 변화량 제어
- 위 내용들은 우측 하단 "검증 결과" 탭에서 확인할 수 있습니다.

## 주의 사항 및 한계
- 본 앱은 개념 증명 및 교육용 도구입니다.
- 실제 무기체계나 방산 기기 설계에 직접 활용할 수 없으며, 좌굴/피로/충격 등의 비선형적 거동은 고려되지 않았습니다.
