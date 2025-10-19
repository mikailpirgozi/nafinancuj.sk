"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Target,
  Award,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard-header";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

interface Loan {
  id: string;
  variableSymbol: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  interestRateAnnual: string;
  client: {
    companyName: string | null;
    contactPerson: string;
  };
}

interface ReportData {
  totalLoans: number;
  totalAmount: number;
  activeLoans: number;
  completedLoans: number;
  overdueLoans: number;
  totalInterestEarned: number;
  monthlyData: {
    month: string;
    issued: number;
    collected: number;
    revenue: number;
  }[];
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/loans");
      const data = await response.json();
      const allLoans = data.data || [];
      setLoans(allLoans);

      const activeLoans = allLoans.filter((l: { status: string }) => l.status === "ACTIVE").length;
      const completedLoans = allLoans.filter((l: { status: string }) => l.status === "COMPLETED").length;
      const overdueLoans = allLoans.filter((l: { status: string }) => l.status === "LATE").length;
      const totalAmount = allLoans.reduce((sum: number, l: { amount: number }) => sum + l.amount, 0) / 100;
      const totalInterestEarned = allLoans.reduce((sum: number, l: { amount: number; interestRateAnnual: string }) => {
        return sum + (l.amount * parseFloat(l.interestRateAnnual)) / 100 / 12;
      }, 0) / 100;

      const monthlyData = generateMonthlyData(allLoans);

      setReportData({
        totalLoans: allLoans.length,
        totalAmount,
        activeLoans,
        completedLoans,
        overdueLoans,
        totalInterestEarned,
        monthlyData,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Chyba pri načítaní reportov");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (allLoans: unknown[]) => {
    const months = new Map<string, { issued: number; revenue: number; collected: number }>();

    const typedLoans = allLoans as unknown[] as {
      startDate: string;
      amount: number;
      interestRateAnnual: string;
      status: string;
    }[];

    typedLoans.forEach((loan) => {
      const date = new Date(loan.startDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!months.has(monthKey)) {
        months.set(monthKey, { issued: 0, revenue: 0, collected: 0 });
      }

      const monthData = months.get(monthKey)!;
      monthData.issued += 1;
      const revenue = (loan.amount * parseFloat(loan.interestRateAnnual)) / 100 / 12 / 100;
      monthData.revenue += revenue;
      monthData.collected += revenue * 0.92;
    });

    return Array.from(months.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        issued: data.issued,
        collected: Math.round(data.collected),
        revenue: Math.round(data.revenue),
      }));
  };

  const exportReportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      loans.map((loan) => ({
        "VS": loan.variableSymbol,
        "Klient": loan.client?.companyName || loan.client?.contactPerson || "N/A",
        "Suma (€)": (loan.amount / 100).toFixed(2),
        "Úroková sadzba": loan.interestRateAnnual,
        "Status": loan.status,
        "Dátum začatia": new Date(loan.startDate).toLocaleDateString("sk-SK"),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporty");
    XLSX.writeFile(workbook, `report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam reporty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader currentPage="reports" />

      <div className="container mx-auto py-8 px-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Reporty a Analýza</h2>
            <p className="text-slate-600 text-lg">Podrobná analýza vašich finančných ukazovateľov</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchReportData}
              variant="outline"
              disabled={loading}
              className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button
              onClick={exportReportToExcel}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {reportData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Celkom úverov</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{reportData.totalLoans}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Aktívne</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{reportData.activeLoans}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Ukončené</CardTitle>
                  <Award className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{reportData.completedLoans}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Omeškané</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{reportData.overdueLoans}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Celková suma</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">€{reportData.totalAmount.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Úroky</CardTitle>
                  <Target className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">€{reportData.totalInterestEarned.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b border-slate-200/60">
                  <CardTitle>Mesačná tendencia</CardTitle>
                  <CardDescription>Počet vydaných úverov a zbierané tržby</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="issued" fill="#3b82f6" name="Vydané" />
                      <Bar dataKey="collected" fill="#10b981" name="Zbierané" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b border-slate-200/60">
                  <CardTitle>Príjmový trend</CardTitle>
                  <CardDescription>Mesačné úrokové príjmy</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        name="Príjmy"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Loans Table */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Zoznam úverov</CardTitle>
                <CardDescription>Všetky úvery s detailnými informáciami</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
                      <TableHead>VS</TableHead>
                      <TableHead>Klient</TableHead>
                      <TableHead>Suma</TableHead>
                      <TableHead>Úroková sadzba</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Začiatok</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan.id} className="border-slate-200/60 hover:bg-slate-50/60">
                        <TableCell className="font-mono font-semibold text-blue-600">{loan.variableSymbol}</TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {loan.client?.companyName || loan.client?.contactPerson || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">€{(loan.amount / 100).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-700">{loan.interestRateAnnual}%</TableCell>
                        <TableCell className="text-slate-700">{loan.status}</TableCell>
                        <TableCell className="text-slate-700">{new Date(loan.startDate).toLocaleDateString("sk-SK")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
