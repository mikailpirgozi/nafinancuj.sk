"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Download,
  FileText,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";

interface ReportStats {
  totalLoans: number;
  totalVolume: number;
  totalPaid: number;
  overdueMoney: number;
  newApplications: number;
  approvedApplications: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/overview?from=${dateFrom}&to=${dateTo}`);
      if (!response.ok) throw new Error("Chyba pri načítaní dát");

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní reportu");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Initialize dates on mount
  useEffect(() => {
    setMounted(true);
    setDateFrom(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
    setDateTo(format(new Date(), "yyyy-MM-dd"));
  }, []);

  // Fetch data when dates are ready
  useEffect(() => {
    if (mounted && dateFrom && dateTo) {
      fetchReportData();
    }
  }, [fetchReportData, mounted, dateFrom, dateTo]);

  const handleExportPDF = () => {
    toast.info("Export do PDF sa pripravuje...");
    setTimeout(() => {
      toast.success("Report bol exportovaný");
    }, 1000);
  };

  const handleExportExcel = () => {
    toast.info("Export do Excelu sa pripravuje...");
    setTimeout(() => {
      toast.success("Report bol exportovaný");
    }, 1000);
  };

  if (!mounted) return null;

  const repaymentRate = stats ? Math.round((stats.totalPaid / stats.totalVolume) * 100) : 0;
  const approvalRate = stats && (stats.newApplications + stats.approvedApplications) > 0
    ? Math.round((stats.approvedApplications / (stats.newApplications + stats.approvedApplications)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Reporty</h1>
              <p className="text-slate-600">Analýza a prehľady vašich dát</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchReportData} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Od</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-slate-200" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Do</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-slate-200" />
              </div>
              <Button onClick={fetchReportData} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Vygenerovať
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Prehľad
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Cash Flow
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Portfólio
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Vlastný report
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Poskytnuté úvery</CardTitle>
                  <DollarSign className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">€{stats ? (stats.totalVolume / 100).toLocaleString() : "0"}</div>
                  <p className="text-white/80 text-sm">{stats?.totalLoans} úverov</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Inkaso</CardTitle>
                  <TrendingUp className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">€{stats ? (stats.totalPaid / 100).toLocaleString() : "0"}</div>
                  <p className="text-white/80 text-sm">{repaymentRate}% splatené</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-600 to-amber-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Omeškané</CardTitle>
                  <BarChart3 className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">€{stats ? (stats.overdueMoney / 100).toLocaleString() : "0"}</div>
                  <p className="text-white/80 text-sm">Nezaplatené</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Nové žiadosti</CardTitle>
                  <Calendar className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{stats?.newApplications || 0}</div>
                  <p className="text-white/80 text-sm">V tomto období</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Schválené žiadosti</CardTitle>
                  <TrendingUp className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{stats?.approvedApplications || 0}</div>
                  <p className="text-white/80 text-sm">{approvalRate}% schválenie</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-rose-600 to-red-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Zvyšná suma</CardTitle>
                  <DollarSign className="h-6 w-6 text-white" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">€{stats ? ((stats.totalVolume - stats.totalPaid) / 100).toLocaleString() : "0"}</div>
                  <p className="text-white/80 text-sm">K splácaniu</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Top 10 klientov</CardTitle>
                <CardDescription>Klienti s najväčším objemom úverov</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Klient</TableHead>
                      <TableHead>Počet úverov</TableHead>
                      <TableHead>Objem</TableHead>
                      <TableHead>Zaplatené</TableHead>
                      <TableHead>Omeškané</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i} className="border-slate-200/60 hover:bg-slate-50/60">
                        <TableCell className="font-medium">{i}</TableCell>
                        <TableCell>ABC Trading s.r.o.</TableCell>
                        <TableCell>3</TableCell>
                        <TableCell className="font-bold">€15,000</TableCell>
                        <TableCell className="text-emerald-600">€12,500</TableCell>
                        <TableCell className="text-red-600">€0</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Cash Flow */}
          <TabsContent value="cashflow" className="mt-6 space-y-8">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Mesačný Cash Flow</CardTitle>
                <CardDescription>Očakávané vs. skutočné príjmy na 12 mesiacov</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-100 rounded-lg p-8 text-center text-slate-600">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <p>Graf Cash Flow sa nachádza v Recharts komponente</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Tabuľka mesačných príjmov</CardTitle>
                <CardDescription>Detailný prehľad mesačných príjmov</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
                      <TableHead>Mesiac</TableHead>
                      <TableHead>Očakávané</TableHead>
                      <TableHead>Skutočné</TableHead>
                      <TableHead>Rozdiel</TableHead>
                      <TableHead>Miera inkasa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {["Januar", "február", "Marec"].map((month) => (
                      <TableRow key={month} className="border-slate-200/60 hover:bg-slate-50/60">
                        <TableCell className="font-medium">{month}</TableCell>
                        <TableCell>€10,000</TableCell>
                        <TableCell className="font-bold text-emerald-600">€9,500</TableCell>
                        <TableCell className="text-amber-600">-€500</TableCell>
                        <TableCell>95%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Portfolio */}
          <TabsContent value="portfolio" className="mt-6 space-y-8">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Analýza portfólia</CardTitle>
                <CardDescription>Rozdelenie úverov podľa rôznych kategórií</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Úvery podľa statusu</h3>
                  <div className="bg-slate-100 rounded-lg p-8 text-center text-slate-600">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <p>Pie Chart - Úvery podľa statusu</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Úvery podľa produktu</h3>
                  <div className="bg-slate-100 rounded-lg p-8 text-center text-slate-600">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <p>Pie Chart - Úvery podľa produktu</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Riziková analýza</CardTitle>
                <CardDescription>Klasifikácia portfólia podľa rizika</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
                      <TableHead>Kategória</TableHead>
                      <TableHead>Počet</TableHead>
                      <TableHead>Objem</TableHead>
                      <TableHead>% portfólia</TableHead>
                      <TableHead>Riziko</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-200/60 hover:bg-slate-50/60">
                      <TableCell className="font-medium">Nízke riziko</TableCell>
                      <TableCell>15</TableCell>
                      <TableCell className="font-bold">€50,000</TableCell>
                      <TableCell>50%</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-800">Nízke</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-200/60 hover:bg-slate-50/60">
                      <TableCell className="font-medium">Stredné riziko</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell className="font-bold">€35,000</TableCell>
                      <TableCell>35%</TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-800">Stredné</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-200/60 hover:bg-slate-50/60">
                      <TableCell className="font-medium">Vysoké riziko</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell className="font-bold">€15,000</TableCell>
                      <TableCell>15%</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">Vysoké</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Custom */}
          <TabsContent value="custom" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Vlastný report builder</CardTitle>
                <CardDescription>Vytvorte si vlastný report podľa vašich potrieb</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Metriky</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Úvery", "Platby", "Omeškané", "Aplikácie", "Klienti", "Tržby"].map((metric) => (
                      <label key={metric} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{metric}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Filtry</h3>
                  <div className="space-y-2">
                    <Input placeholder="Pridať filter..." className="border-slate-200" />
                    <p className="text-sm text-slate-600">Podľa statusu, typu, klienta...</p>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Vygenerovať report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
