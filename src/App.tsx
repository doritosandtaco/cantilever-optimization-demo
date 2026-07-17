import React, { useState, useEffect } from 'react';
import { useTopologyWorker } from './hooks/useTopologyWorker';
import { WarningBanner } from './components/WarningBanner';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ConvergenceCharts } from './components/ConvergenceCharts';
import { InputState } from './solver/types';
import { Play, Square, Pause, StepForward, RotateCcw } from 'lucide-react';
import { exportCSV, exportJSON } from './utils/exportResults';

const DEFAULT_INPUT: InputState = {
  L: 300,
  H: 100,
  t: 10,
  nelx: 60,
  nely: 20,
  E: 210000,
  nu: 0.3,
  density: 7.85e-6,
  yieldStrength: 250,
  loadMag: 10000,
  loadAngle: -90,
  loadPosition: 0.5,
  volumeFraction: 0.4,
  penalization: 3.0,
  filterRadius: 1.5,
  moveLimit: 0.2,
  convergenceTolerance: 0.01,
  maxIterations: 100,
  minIterations: 10
};

export default function App() {
  const [input, setInput] = useState<InputState>(DEFAULT_INPUT);
  const { state, meshInfo, vMises, U, init, start, pause, step } = useTopologyWorker();
  const [viewMode, setViewMode] = useState<'density' | 'stress'>('density');
  const [threshold, setThreshold] = useState<number>(0.1);

  // Auto-init on mount or input change
  useEffect(() => {
    if (state.status === 'IDLE' || state.status === 'CONVERGED' || state.status === 'MAX_ITER_REACHED') {
      init(input);
    }
  }, [input, init]);

  const handleInputChange = (key: keyof InputState, value: number) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        <header className="flex justify-between items-end border-b pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Structure & Protection Topology Lab</h1>
            <p className="text-sm text-slate-500">Cantilever Beam 위상최적화 및 AI 코딩 실습</p>
          </div>
          <div className="text-sm font-medium px-2 py-1 bg-slate-200 rounded">
            Status: <span className="font-bold">{state.status}</span>
          </div>
        </header>

        <WarningBanner />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded shadow-sm border">
              <h2 className="text-sm font-bold mb-3 border-b pb-1">모델 설정</h2>
              <div className="space-y-2 text-sm">
                <label className="block"><span className="text-gray-600 inline-block w-24">Length (mm)</span><input type="number" value={input.L} onChange={e => handleInputChange('L', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">Height (mm)</span><input type="number" value={input.H} onChange={e => handleInputChange('H', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">Nel X</span><input type="number" value={input.nelx} onChange={e => handleInputChange('nelx', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">Nel Y</span><input type="number" value={input.nely} onChange={e => handleInputChange('nely', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">E (MPa)</span><input type="number" value={input.E} onChange={e => handleInputChange('E', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">Load (N)</span><input type="number" value={input.loadMag} onChange={e => handleInputChange('loadMag', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">VolFrac</span><input type="number" step="0.05" value={input.volumeFraction} onChange={e => handleInputChange('volumeFraction', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
                <label className="block"><span className="text-gray-600 inline-block w-24">Filter Rad</span><input type="number" step="0.1" value={input.filterRadius} onChange={e => handleInputChange('filterRadius', +e.target.value)} className="w-20 border px-1" disabled={state.status === 'RUNNING'} /></label>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border space-y-2">
              <h2 className="text-sm font-bold mb-3 border-b pb-1">실행 제어</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={start} disabled={state.status === 'RUNNING'} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"><Play className="w-4 h-4 mr-1"/> 최적화 실행</button>
                <button onClick={pause} disabled={state.status !== 'RUNNING'} className="flex items-center px-3 py-1.5 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 disabled:opacity-50"><Pause className="w-4 h-4 mr-1"/> 일시정지</button>
                <button onClick={step} disabled={state.status === 'RUNNING'} className="flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"><StepForward className="w-4 h-4 mr-1"/> 1 Iter</button>
                <button onClick={() => init(input)} disabled={state.status === 'RUNNING'} className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"><RotateCcw className="w-4 h-4 mr-1"/> 초기화</button>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border space-y-2">
               <h2 className="text-sm font-bold mb-3 border-b pb-1">내보내기</h2>
               <div className="flex flex-wrap gap-2">
                 <button onClick={() => exportCSV(state, 'history.csv')} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-sm rounded">CSV 저장</button>
                 <button onClick={() => exportJSON({ input, history: state.complianceHistory.map((c,i)=>({ iter:i+1, compliance: c, vol: state.volHistory[i], change: state.changeHistory[i] })) }, 'results.json')} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-sm rounded">JSON 저장</button>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            
            {/* Canvas Area */}
            <div className="flex-1 bg-white p-4 rounded shadow-sm border flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button onClick={() => setViewMode('density')} className={`px-3 py-1 text-sm rounded ${viewMode === 'density' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>밀도 (Density)</button>
                  <button onClick={() => setViewMode('stress')} className={`px-3 py-1 text-sm rounded ${viewMode === 'stress' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>응력 (Von Mises)</button>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-600">Threshold:</span>
                  <input type="range" min="0" max="1" step="0.05" value={threshold} onChange={(e) => setThreshold(+e.target.value)} />
                  <span className="w-8">{threshold.toFixed(2)}</span>
                </div>
              </div>
              <SimulationCanvas xPhys={state.xPhys} U={U} vMises={vMises} meshInfo={meshInfo} input={input} viewMode={viewMode} densityThreshold={threshold} />
              
              {/* Metrics */}
              <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                <div className="bg-slate-50 p-2 rounded border"><div className="text-xs text-slate-500">Iteration</div><div className="font-mono text-sm">{state.iteration} / {input.maxIterations}</div></div>
                <div className="bg-slate-50 p-2 rounded border"><div className="text-xs text-slate-500">Compliance</div><div className="font-mono text-sm">{state.complianceHistory.at(-1)?.toExponential(2) || '-'}</div></div>
                <div className="bg-slate-50 p-2 rounded border"><div className="text-xs text-slate-500">Volume Frac</div><div className="font-mono text-sm">{state.volHistory.at(-1)?.toFixed(3) || '-'}</div></div>
                <div className="bg-slate-50 p-2 rounded border"><div className="text-xs text-slate-500">Max Change</div><div className="font-mono text-sm">{state.changeHistory.at(-1)?.toFixed(4) || '-'}</div></div>
                <div className="bg-slate-50 p-2 rounded border"><div className="text-xs text-slate-500">Time (s)</div><div className="font-mono text-sm">{state.timeHistory.at(-1)?.toFixed(2) || '-'}</div></div>
              </div>
            </div>

            {/* Charts */}
            <ConvergenceCharts state={state} />

          </div>
        </div>
        
        {/* Validation & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow-sm border">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">코드 학습 (Code Mapping)</h2>
            <ul className="text-sm space-y-1 text-slate-700">
              <li><span className="font-mono bg-slate-100 px-1 rounded text-blue-600">src/solver/mesh.ts</span>: 요소망 생성 및 자유도 매핑 (Q4 요소)</li>
              <li><span className="font-mono bg-slate-100 px-1 rounded text-blue-600">src/solver/element.ts</span>: 평면응력 강성행렬 계산</li>
              <li><span className="font-mono bg-slate-100 px-1 rounded text-blue-600">src/solver/pcg.ts</span>: Preconditioned Conjugate Gradient (희소 행렬 솔버)</li>
              <li><span className="font-mono bg-slate-100 px-1 rounded text-blue-600">src/solver/filter.ts</span>: 밀도 필터 적용</li>
              <li><span className="font-mono bg-slate-100 px-1 rounded text-blue-600">src/solver/optimalityCriteria.ts</span>: SIMP OC 밀도 업데이트 로직</li>
              <li><span className="font-mono bg-slate-100 px-1 rounded text-blue-600">src/workers/topologyWorker.ts</span>: Web Worker 백그라운드 스레드 제어</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">검증 결과 (Validation)</h2>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>설정 체적분율: <span className="font-mono">{input.volumeFraction}</span></li>
              <li>실제 체적분율: <span className="font-mono">{state.volHistory.at(-1)?.toFixed(4) ?? '-'}</span></li>
              <li>최종 솔버 Residual: <span className="font-mono">{state.residualHistory.at(-1)?.toExponential(2) ?? '-'}</span></li>
              <li>초기 Compliance: <span className="font-mono">{state.complianceHistory[0]?.toExponential(2) ?? '-'}</span></li>
              <li>Mesh 크기: <span className="font-mono">{meshInfo ? `${meshInfo.nelx} x ${meshInfo.nely} (${meshInfo.nnodes} nodes)` : '-'}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
