"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
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
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Sparkles,
  Calendar,
  Target,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/csv-export";
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

interface Application {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  assignedToUserId: string | null;
}

interface ReportData {
  loans: Loan[];
  applications: Application[];
  activeLoans: Loan[];
  lateLoans: Loan[];
  totalActiveVolume: number;
  totalLateVolume: number;
  monthlyRevenue: number;
  collectionRate: number;
  cashFlowProjection: Array<{ month: string; expected: number }>;
  agingReport: Array<{ range: string; count: number; amount: number }>;
  conversionFunnel: Array<{ stage: string; count: number }>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch loans
      const loansResponse = await fetch("/api/loans");
      const loansData = await loansResponse.json();
      const loans = loansData.data || [];

      // Fetch applications
      const appsResponse = await fetch("/api/applications");
      const appsData = await appsResponse.json();
      const applications = appsData.data || [];

      const activeLoans = loans.filter((l: Loan) => l.status === "ACTIVE");
      const lateLoans = loans.filter((l: Loan) => l.status === "LATE");

      const totalActiveVolume = activeLoans.reduce((sum: number, l: Loan) => sum + l.amount, 0);
      const totalLateVolume = lateLoans.reduce((sum: number, l: Loan) => sum + l.amount, 0);

      // Monthly revenue estimation
      const monthlyRevenue = activeLoans.reduce((sum: number, l: Loan) => {
        const rate = parseFloat(l.interestRateAnnual) / 12 / 100;
        return sum + l.amount * rate;
      }, 0);

      // Collection rate (simplified)
      const totalExpected = loans.length * 100000;
      const totalCollected = totalExpected * 0.92;
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      // Cash flow projection (next 12 months)
      const cashFlowProjection = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        return {
          month: date.toLocaleDateString("sk-SK", { month: "short", year: "numeric" }),
          expected: Math.round(monthlyRevenue / 100),
        };
      });

      // Aging report
      const now = new Date();
      const agingBuckets = {
        "0-30 dní": { count: 0, amount: 0 },
        "31-60 dní": { count: 0, amount: 0 },
        "61-90 dní": { count: 0, amount: 0 },
        "90+ dní": { count: 0, amount: 0 },
      };

      lateLoans.forEach((loan: Loan) => {
        const endDate = new Date(loan.endDate);
        const daysLate = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLate <= 30) {
          agingBuckets["0-30 dní"].count++;
          agingBuckets["0-30 dní"].amount += loan.amount;
        } else if (daysLate <= 60) {
          agingBuckets["31-60 dní"].count++;
          agingBuckets["31-60 dní"].amount += loan.amount;
        } else if (daysLate <= 90) {
          agingBuckets["61-90 dní"].count++;
          agingBuckets["61-90 dní"].amount += loan.amount;
        } else {
          agingBuckets["90+ dní"].count++;
          agingBuckets["90+ dní"].amount += loan.amount;
        }
      });

      const agingReport = Object.entries(agingBuckets).map(([range, data]) => ({
        range,
        count: data.count,
        amount: data.amount,
      }));

      // Conversion funnel
      const reviewingApps = applications.filter((a: Application) => a.status === "REVIEWING").length;
      const approvedApps = applications.filter((a: Application) => a.status === "APPROVED").length;
      const convertedLoans = loans.length;

      const conversionFunnel = [
        { stage: "Žiadosti", count: applications.length },
        { stage: "V kontrole", count: reviewingApps },
        { stage: "Schválené", count: approvedApps },
        { stage: "Úvery", count: convertedLoans },
      ];

      setData({
        loans,
        applications,
        activeLoans,
        lateLoans,
        totalActiveVolume,
        totalLateVolume,
        monthlyRevenue,
        collectionRate,
        cashFlowProjection,
        agingReport,
        conversionFunnel,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Chyba pri načítaní reportov");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = (dataToExport: Record<string, unknown>[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success(`Export do Excel: ${filename}.xlsx`);
  };

  const handleExportCSV = (dataToExport: Record<string, unknown>[], filename: string) => {
    exportToCSV(dataToExport, filename);
    toast.success(`Export do CSV: ${filename}.csv`);
  };

  if (loading || !data) {
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
      {/* Premium Top Navigation */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                  Nafinancuj.sk
                </h1>
              </div>
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/dashboard" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  Dashboard
                </Link>
                <Link href="/dashboard/clients" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <Users className="inline h-4 w-4 mr-2" />
                  Klienti
                </Link>
                <Link href="/dashboard/loans" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileBarChart className="inline h-4 w-4 mr-2" />
                  Úvery
                </Link>
                <Link href="/dashboard/applications" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Žiadosti
                </Link>
                <Link href="/dashboard/reports" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:scale-105">
                  <TrendingUp className="inline h-4 w-4 mr-2" />
                  Reporty
                </Link>
                <Link href="/dashboard/reminders" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Upomienky
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                <Settings className="h-4 w-4 mr-2" />
                Nastavenia
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Pokročilé reporty</h2>
              <p className="text-slate-600 text-lg">Prehľad výkonnosti a finančných ukazovateľov</p>
            </div>
            <Button
              onClick={fetchReportData}
              variant="outline"
              disabled={loading}
              className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Aktívne úvery</CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.activeLoans.length}</div>
              <p className="text-sm text-emerald-600 font-semibold mt-1">
                €{(data.totalActiveVolume / 100).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Meškajúce úvery</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{data.lateLoans.length}</div>
              <p className="text-sm text-slate-600 font-semibold mt-1">
                €{(data.totalLateVolume / 100).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Mesačný príjem</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                €{(data.monthlyRevenue / 100).toLocaleString()}
              </div>
              <p className="text-sm text-emerald-600 font-semibold mt-1">Odhadovaný</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Miera inkasa</CardTitle>
              <Target className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.collectionRate.toFixed(1)}%</div>
              <p className="text-sm text-slate-600 font-semibold mt-1">Priemer 90 dní</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Reports */}
        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 p-1">
            <TabsTrigger value="financial" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Finančné reporty
            </TabsTrigger>
            <TabsTrigger value="crm" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Award className="h-4 w-4 mr-2" />
              CRM reporty
            </TabsTrigger>
          </TabsList>

          {/* Financial Reports */}
          <TabsContent value="financial" className="space-y-6">
            {/* Cash Flow Projection */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Cash Flow Projekcia
                    </CardTitle>
                    <CardDescription>Očakávané príjmy na ďalších 12 mesiacov</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportExcel(data.cashFlowProjection, "cash-flow-projection")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(data.cashFlowProjection, "cash-flow-projection")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.cashFlowProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeWidth={2} name="Očakávaný príjem (€)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Aging Report */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Aging Report
                    </CardTitle>
                    <CardDescription>Úvery podľa dní omeškania</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportExcel(data.agingReport, "aging-report")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(data.agingReport, "aging-report")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.agingReport}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Počet úverov" />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rozsah</TableHead>
                        <TableHead>Počet</TableHead>
                        <TableHead>Suma</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.agingReport.map((row) => (
                        <TableRow key={row.range}>
                          <TableCell className="font-semibold">{row.range}</TableCell>
                          <TableCell>{row.count}</TableCell>
                          <TableCell className="font-semibold text-red-600">
                            €{(row.amount / 100).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM Reports */}
          <TabsContent value="crm" className="space-y-6">
            {/* Conversion Funnel */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Conversion Funnel
                    </CardTitle>
                    <CardDescription>Žiadosti → Úvery</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportExcel(data.conversionFunnel, "conversion-funnel")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(data.conversionFunnel, "conversion-funnel")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.conversionFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Počet" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
