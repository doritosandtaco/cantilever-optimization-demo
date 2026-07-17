import { useState, useEffect, useRef, useCallback } from 'react';
import { InputState, OptimizationState } from '../solver/types';

export function useTopologyWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<OptimizationState>({
    iteration: 0,
    x: new Float64Array(0),
    xPhys: new Float64Array(0),
    change: 1,
    complianceHistory: [],
    volHistory: [],
    changeHistory: [],
    residualHistory: [],
    timeHistory: [],
    startTime: 0,
    status: 'IDLE'
  });
  const [meshInfo, setMeshInfo] = useState<any>(null);
  const [vMises, setVMises] = useState<Float64Array | null>(null);
  const [U, setU] = useState<Float64Array | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/topologyWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'STATE_UPDATE') {
        setState(prev => ({ ...prev, ...payload }));
        if (payload.mesh) setMeshInfo(payload.mesh);
        if (payload.vMises) setVMises(payload.vMises);
        if (payload.U) setU(payload.U);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const init = useCallback((input: InputState) => {
    workerRef.current?.postMessage({ type: 'INIT', payload: input });
  }, []);

  const start = useCallback(() => {
    workerRef.current?.postMessage({ type: 'START' });
  }, []);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: 'PAUSE' });
  }, []);

  const step = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STEP' });
  }, []);

  return { state, meshInfo, vMises, U, init, start, pause, step };
}
