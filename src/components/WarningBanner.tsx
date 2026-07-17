import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export function WarningBanner() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm text-yellow-800">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600 flex-shrink-0" />
        <div>
          <p className="font-bold">교육용 개념검증 도구 안내</p>
          <p>
            본 앱은 구조최적화와 AI 코딩 교육을 위한 개념검증 도구입니다. 결과는 선형 정적 2D 모델에 근거하며, 
            실제 방산 구조물의 설계 승인, 방호성능 판정 또는 안전성 입증에 사용할 수 없습니다. 
            실제 설계에는 상세 CAD 재구성, 검증된 CAE 해석, 비선형성 검토 및 시험평가가 추가로 필요합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
