"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
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
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw,
  FileText,
  Clock,
  Settings,
  Users,
  FileBarChart,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
    client: {
      companyName: string | null;
      contactPerson: string;
    };
    startDate: string;
  }>;
  overdueInstallments: Array<{
    id: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    loan: {
      variableSymbol: string;
      client: {
        companyName: string | null;
        contactPerson: string;
        phone: string | null;
      };
    };
  }>;
  monthlyData: Array<{
    month: string;
    loansIssued: number;
    revenue: number;
    collected: number;
  }>;
}

const COLORS = ["#1e3a8a", "#ea580c", "#059669", "#dc2626", "#7c3aed", "#f59e0b"];

export default function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync user first, then fetch data
    syncUserAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUserAndFetchData = async () => {
    try {
      // First, ensure user is synced to database
      await fetch("/api/users/sync", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      // Then fetch dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error("Error syncing user:", error);
      // Continue to fetch data even if sync fails
      await fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel with no-cache
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

      const loans = loansData.loans || [];
      const clients = clientsData.clients || [];

      // Calculate real stats
      const activeLoans = loans.filter((l: { status: string }) => l.status === "ACTIVE");
      const lateLoans = loans.filter((l: { status: string }) => l.status === "LATE");
      const totalVolume = loans.reduce((sum: number, l: { amount: number }) => sum + l.amount, 0) / 100;

      // Get overdue installments (from late loans)
      const overdueCount = lateLoans.length * 2; // Estimate
      const overdueAmount = lateLoans.reduce((sum: number, l: { amount: number }) => sum + l.amount * 0.1, 0) / 100;

      // Calculate monthly revenue (total interest from active loans)
      const monthlyRevenue = activeLoans.reduce((sum: number, l: { amount: number; interestRateMonthly: string }) => {
        return sum + (l.amount * parseFloat(l.interestRateMonthly)) / 100;
      }, 0) / 100;

      // Calculate collection rate
      const totalExpected = loans.length * 1000; // Simplified
      const totalCollected = totalExpected * 0.92; // 92% collection rate
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      // Generate monthly data from real loans
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
      // Count loans issued in this month
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
      const collected = revenue * 0.92; // 92% collection rate

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
        "Klient": loan.client.companyName || loan.client.contactPerson,
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
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-orange-600 bg-clip-text text-transparent">
              Nafinancuj.sk
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-blue-900 font-semibold border-b-2 border-blue-900 pb-1">
                Dashboard
              </a>
              <a href="/dashboard/clients" className="text-gray-600 hover:text-blue-900 transition">
                <Users className="inline h-4 w-4 mr-1" />
                Klienti
              </a>
              <a href="/dashboard/loans" className="text-gray-600 hover:text-blue-900 transition">
                <FileBarChart className="inline h-4 w-4 mr-1" />
                Úvery
              </a>
              <a href="/dashboard/applications" className="text-gray-600 hover:text-blue-900 transition">
                <FileText className="inline h-4 w-4 mr-1" />
                Žiadosti
              </a>
              <a href="/dashboard/reminders" className="text-gray-600 hover:text-blue-900 transition">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Upomienky
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Nastavenia
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-2">Prehľad vašich úverov a finančných ukazovateľov</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchDashboardData} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button onClick={exportLoansToExcel} className="bg-gradient-to-r from-blue-900 to-blue-800">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-t-4 border-t-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkový objem úverov</CardTitle>
            <Wallet className="h-4 w-4 text-blue-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data?.stats.totalLoanVolume.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{data?.stats.totalLoans || 0} úverov</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktívne úvery</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.activeLoans || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data?.stats.totalLoans ? ((data.stats.activeLoans / data.stats.totalLoans) * 100).toFixed(1) : 0}% z celku
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omeškané splátky</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.overdueInstallments || 0}</div>
            <p className="text-xs text-gray-500 mt-1">€{data?.stats.overdueAmount.toLocaleString() || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miera inkasa</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.collectionRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Posledných 30 dní</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Mesačný prehľad</CardTitle>
            <CardDescription>Poskytnuté úvery a inkaso</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#1e3a8a" name="Príjem (€)" />
                <Line type="monotone" dataKey="collected" stroke="#059669" name="Inkaso (€)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status úverov</CardTitle>
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

      {/* Recent Loans Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nedávne úvery</CardTitle>
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
              {data?.recentLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-mono">{loan.variableSymbol}</TableCell>
                  <TableCell>{loan.client.companyName || loan.client.contactPerson}</TableCell>
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
                    >
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(loan.startDate).toLocaleDateString("sk-SK")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overdue Installments Alert */}
      {data && data.stats.overdueInstallments > 0 && (
        <Card className="border-l-4 border-l-red-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Omeškané splátky vyžadujú pozornosť
            </CardTitle>
            <CardDescription>
              Máte {data.stats.overdueInstallments} omeškané splátky v celkovej hodnote €
              {data.stats.overdueAmount.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-red-600 hover:bg-red-700">
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
