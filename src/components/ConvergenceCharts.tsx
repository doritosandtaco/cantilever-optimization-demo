import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OptimizationState } from '../solver/types';

export function ConvergenceCharts({ state }: { state: OptimizationState }) {
  const data = state.complianceHistory.map((c, i) => ({
    iteration: i + 1,
    compliance: c,
    volume: state.volHistory[i],
    change: state.changeHistory[i]
  }));

  if (data.length === 0) {
    return <div className="p-4 text-sm text-gray-500">결과가 없습니다. 최적화를 실행해주세요.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-64">
      <div className="bg-white p-2 border rounded shadow-sm">
        <div className="text-xs font-semibold mb-1 text-center">Compliance</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="iteration" fontSize={10} type="number" domain={['dataMin', 'dataMax']} />
            <YAxis fontSize={10} type="number" tickFormatter={(v) => v.toExponential(2)} />
            <Tooltip contentStyle={{ fontSize: '10px' }} labelFormatter={(v) => `Iteration: ${v}`} formatter={(v: number) => v.toExponential(4)} />
            <Line type="monotone" dataKey="compliance" stroke="#2563eb" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-2 border rounded shadow-sm">
        <div className="text-xs font-semibold mb-1 text-center">Volume Fraction</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="iteration" fontSize={10} type="number" domain={['dataMin', 'dataMax']} />
            <YAxis fontSize={10} type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip contentStyle={{ fontSize: '10px' }} labelFormatter={(v) => `Iteration: ${v}`} formatter={(v: number) => v.toFixed(4)} />
            <Line type="monotone" dataKey="volume" stroke="#16a34a" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-2 border rounded shadow-sm">
        <div className="text-xs font-semibold mb-1 text-center">Max Density Change</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="iteration" fontSize={10} type="number" domain={['dataMin', 'dataMax']} />
            <YAxis fontSize={10} type="number" tickFormatter={(v) => v.toExponential(2)} />
            <Tooltip contentStyle={{ fontSize: '10px' }} labelFormatter={(v) => `Iteration: ${v}`} formatter={(v: number) => v.toExponential(4)} />
            <Line type="monotone" dataKey="change" stroke="#dc2626" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
