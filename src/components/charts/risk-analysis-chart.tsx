"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RiskData {
  category: string;
  count: number;
  volume: number;
  percentage: number;
}

interface RiskAnalysisChartProps {
  data: RiskData[];
}

const RISK_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

export function RiskAnalysisChart({ data }: RiskAnalysisChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => `€${value.toLocaleString('sk-SK', { maximumFractionDigits: 2 })}`}
        />
        <Legend />
        <Bar 
          dataKey="volume" 
          fill="#3b82f6" 
          name="Objem portfólia (€)"
        />
        <Bar 
          dataKey="count" 
          fill="#8b5cf6" 
          name="Počet úverov"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
