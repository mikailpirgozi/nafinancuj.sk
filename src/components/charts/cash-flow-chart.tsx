"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CashFlowData {
  month: string;
  expected: number;
  actual: number;
  difference: number;
  collectionRate: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => `€${value.toLocaleString('sk-SK', { maximumFractionDigits: 2 })}`}
          labelStyle={{ color: '#000' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="expected" 
          stroke="#3b82f6" 
          name="Očakávané príjmy"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#10b981" 
          name="Skutočné príjmy"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
