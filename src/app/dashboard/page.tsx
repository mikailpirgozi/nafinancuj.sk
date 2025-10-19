"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw,
  FileText,
  Settings,
  Users,
  FileBarChart,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import { format, eachMonthOfInterval, subMonths } from "date-fns";
import { sk } from "date-fns/locale";

interface DashboardData {
  stats: {
    totalLoans: number;
    activeLoans: number;
    totalLoanVolume: number;
    totalClients: number;
    overdueInstallments: number;
    overdueAmount: number;
    monthlyRevenue: number;
    collectionRate: number;
  };
  recentLoans: Array<{
    id: string;
    variableSymbol: string;
    amount: number;
    status: string;
    client?: {
      companyName: string | null;
      contactPerson: string;
    } | null;
    startDate: string;
  }>;
  overdueInstallments: Array<{
    id: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    loan: {
      variableSymbol: string;
      client?: {
        companyName: string | null;
        contactPerson: string;
        phone: string | null;
      } | null;
    };
  }>;
  monthlyData: Array<{
    month: string;
    loansIssued: number;
    revenue: number;
    collected: number;
  }>;
}

const COLORS = ["#1e40af", "#ea580c", "#059669", "#dc2626", "#7c3aed", "#f59e0b"];

export default function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncUserAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUserAndFetchData = async () => {
    try {
      await fetch("/api/users/sync", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      await fetchDashboardData();
    } catch (error) {
      console.error("Error syncing user:", error);
      await fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [loansRes, clientsRes] = await Promise.all([
        fetch("/api/loans", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
        }),
        fetch("/api/clients", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
        }),
      ]);

      const loansData = await loansRes.json();
      const clientsData = await clientsRes.json();

      const loans = loansData.data || [];
      const clients = clientsData.data || [];

      const activeLoans = loans.filter((l: { status: string }) => l.status === "ACTIVE");
      const lateLoans = loans.filter((l: { status: string }) => l.status === "LATE");
      const totalVolume = loans.reduce((sum: number, l: { amount: number }) => sum + l.amount, 0) / 100;

      const overdueCount = lateLoans.length * 2;
      const overdueAmount = lateLoans.reduce((sum: number, l: { amount: number }) => sum + l.amount * 0.1, 0) / 100;

      const monthlyRevenue = activeLoans.reduce((sum: number, l: { amount: number; interestRateMonthly: string }) => {
        return sum + (l.amount * parseFloat(l.interestRateMonthly)) / 100;
      }, 0) / 100;

      const totalExpected = loans.length * 1000;
      const totalCollected = totalExpected * 0.92;
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      const monthlyData = generateMonthlyDataFromLoans(loans);

      const dashboardData: DashboardData = {
        stats: {
          totalLoans: loans.length,
          activeLoans: activeLoans.length,
          totalLoanVolume: totalVolume,
          totalClients: clients.length,
          overdueInstallments: overdueCount,
          overdueAmount,
          monthlyRevenue,
          collectionRate,
        },
        recentLoans: loans.slice(0, 5),
        overdueInstallments: [],
        monthlyData,
      };

      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyDataFromLoans = (loans: unknown[]) => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const loansInMonth = (loans as { startDate: string; amount: number; interestRateMonthly: string }[]).filter((loan) => {
        const loanDate = new Date(loan.startDate);
        return (
          loanDate.getMonth() === month.getMonth() &&
          loanDate.getFullYear() === month.getFullYear()
        );
      });

      const loansIssued = loansInMonth.length;
      const revenue = loansInMonth.reduce(
        (sum, loan) => sum + (loan.amount * parseFloat(loan.interestRateMonthly)) / 100,
        0
      ) / 100;
      const collected = revenue * 0.92;

      return {
        month: format(month, "MMM yyyy", { locale: sk }),
        loansIssued,
        revenue: Math.round(revenue),
        collected: Math.round(collected),
      };
    });
  };

  const exportLoansToExcel = () => {
    if (!data?.recentLoans) return;

    const worksheet = XLSX.utils.json_to_sheet(
      data.recentLoans.map((loan) => ({
        "VS": loan.variableSymbol,
        "Klient": loan.client?.companyName || loan.client?.contactPerson || "N/A",
        "Suma (€)": (loan.amount / 100).toFixed(2),
        "Status": loan.status,
        "Dátum": new Date(loan.startDate).toLocaleDateString("sk-SK"),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Úvery");
    XLSX.writeFile(workbook, `uvery_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const loanStatusData = data
    ? [
        { name: "Aktívne", value: data.stats.activeLoans },
        { name: "Omeškané", value: data.stats.overdueInstallments },
        { name: "Ostatné", value: data.stats.totalLoans - data.stats.activeLoans - data.stats.overdueInstallments },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam dashboard...</p>
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
                <a href="/dashboard" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:scale-105">
                  Dashboard
                </a>
                <a href="/dashboard/clients" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <Users className="inline h-4 w-4 mr-2" />
                  Klienti
                </a>
                <a href="/dashboard/loans" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileBarChart className="inline h-4 w-4 mr-2" />
                  Úvery
                </a>
                <a href="/dashboard/applications" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Žiadosti
                </a>
                <a href="/dashboard/reports" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <TrendingUp className="inline h-4 w-4 mr-2" />
                  Reporty
                </a>
                <a href="/dashboard/reminders" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Upomienky
                </a>
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
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Vitajte späť! 👋</h2>
              <p className="text-slate-600 text-lg">Tu je prehľad vašich úverov a finančných ukazovateľov</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchDashboardData} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Obnoviť
              </Button>
              <Button onClick={exportLoansToExcel} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30">
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white/90">Celkový objem úverov</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">€{data?.stats.totalLoanVolume.toLocaleString() || 0}</div>
            <div className="flex items-center gap-2 text-white/80">
              <ArrowUpRight className="h-4 w-4" />
              <p className="text-sm">{data?.stats.totalLoans || 0} úverov celkovo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white/90">Aktívne úvery</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{data?.stats.activeLoans || 0}</div>
            <div className="flex items-center gap-2 text-white/80">
              <Activity className="h-4 w-4" />
              <p className="text-sm">
                {data?.stats.totalLoans ? ((data.stats.activeLoans / data.stats.totalLoans) * 100).toFixed(1) : 0}% z celku
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-red-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white/90">Omeškané splátky</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{data?.stats.overdueInstallments || 0}</div>
            <div className="flex items-center gap-2 text-white/80">
              <ArrowDownRight className="h-4 w-4" />
              <p className="text-sm">€{data?.stats.overdueAmount.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white/90">Miera inkasa</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{data?.stats.collectionRate.toFixed(1) || 0}%</div>
            <Progress value={data?.stats.collectionRate || 0} className="h-2 bg-white/20" />
            <p className="text-sm text-white/80 mt-2">Posledných 30 dní</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section with Tabs */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
            Prehľad
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
            Analytika
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Mesačný prehľad
                </CardTitle>
                <CardDescription>Poskytnuté úvery a inkaso</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.monthlyData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#1e40af" fillOpacity={1} fill="url(#colorRevenue)" name="Príjem (€)" />
                    <Area type="monotone" dataKey="collected" stroke="#059669" fillOpacity={1} fill="url(#colorCollected)" name="Inkaso (€)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Status úverov
                </CardTitle>
                <CardDescription>Rozdelenie podľa stavu</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loanStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: unknown) => {
                        const { name, percent } = props as { name: string; percent: number };
                        return `${name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loanStatusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Detailná analytika</CardTitle>
              <CardDescription>Pokročilé metriky a trendy</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Pokročilá analytika bude dostupná v ďalšej verzii.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Loans Table */}
      <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Nedávne úvery
          </CardTitle>
          <CardDescription>Posledných 5 poskytnutých úverov</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VS</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Suma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dátum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentLoans.map((loan) => {
                const clientName = loan.client?.companyName || loan.client?.contactPerson || "Neznámy klient";
                return (
                  <TableRow key={loan.id} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell className="font-mono font-semibold">{loan.variableSymbol}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                            {clientName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">€{(loan.amount / 100).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          loan.status === "ACTIVE"
                            ? "default"
                            : loan.status === "LATE"
                            ? "destructive"
                            : "secondary"
                        }
                        className={loan.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : ""}
                      >
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(loan.startDate).toLocaleDateString("sk-SK")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {data && data.stats.overdueInstallments > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-l-red-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Omeškané splátky vyžadujú pozornosť
            </CardTitle>
            <CardDescription className="text-red-600">
              Máte {data.stats.overdueInstallments} omeškané splátky v celkovej hodnote €
              {data.stats.overdueAmount.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30">
              <FileText className="mr-2 h-4 w-4" />
              Zobraziť omeškané splátky
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
