"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Installment {
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface InstallmentProgressChartProps {
  installments: Installment[];
  type?: "principal-interest" | "payment-progress";
}

export function InstallmentProgressChart({
  installments,
  type = "principal-interest",
}: InstallmentProgressChartProps) {
  if (!installments || installments.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-slate-50 rounded-lg">
        <p className="text-slate-600">Žiadne splátky na zobrazenie</p>
      </div>
    );
  }

  if (type === "principal-interest") {
    // Principal vs Interest breakdown
    const data = installments.map((inst) => ({
      installment: `Splátka ${inst.installmentNumber}`,
      principal: inst.principalAmount / 100,
      interest: inst.interestAmount / 100,
      total: inst.totalAmount / 100,
    }));

    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Rozdelenie splátok (istina vs úrok)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="installment"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `€${value.toLocaleString("sk-SK", { maximumFractionDigits: 2 })}`}
              labelStyle={{ color: "#000" }}
            />
            <Legend />
            <Bar dataKey="principal" fill="#3b82f6" name="Istina" stackId="a" />
            <Bar dataKey="interest" fill="#f59e0b" name="Úrok" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Payment progress over time
  let cumulativePaid = 0;
  let cumulativeTotal = 0;

  const data = installments.map((inst) => {
    cumulativeTotal += inst.totalAmount / 100;
    cumulativePaid += inst.paidAmount / 100;

    return {
      installment: `Splátka ${inst.installmentNumber}`,
      expected: cumulativeTotal,
      paid: cumulativePaid,
      percentage: cumulativeTotal > 0 ? Math.round((cumulativePaid / cumulativeTotal) * 100) : 0,
    };
  });

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Priebeh splácania v čase
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="installment"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `€${value.toLocaleString("sk-SK", { maximumFractionDigits: 2 })}`}
            labelStyle={{ color: "#000" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="expected"
            stroke="#3b82f6"
            name="Očakávané"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="paid"
            stroke="#10b981"
            name="Splatené"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

