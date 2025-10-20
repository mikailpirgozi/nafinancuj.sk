"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface PortfolioData {
  name: string;
  value: number;
  percentage: number;
}

interface PortfolioChartProps {
  data: PortfolioData[];
  title: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function PortfolioChart({ data, title }: PortfolioChartProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `€${value.toLocaleString('sk-SK', { maximumFractionDigits: 2 })}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
