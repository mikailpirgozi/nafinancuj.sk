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
} from "lucide-react";
import { toast } from "sonner";

interface Loan {
  id: string;
  variableSymbol: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  client: {
    companyName: string | null;
    contactPerson: string;
  };
}

interface ReportData {
  activeLoans: Loan[];
  lateLoans: Loan[];
  totalActiveVolume: number;
  totalLateVolume: number;
  monthlyRevenue: number;
  collectionRate: number;
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
      const response = await fetch("/api/loans");
      const loansData = await response.json();
      const loans = loansData.data || [];

      const activeLoans = loans.filter((l: Loan) => l.status === "ACTIVE");
      const lateLoans = loans.filter((l: Loan) => l.status === "LATE");

      const totalActiveVolume = activeLoans.reduce((sum: number, l: Loan) => sum + l.amount, 0);
      const totalLateVolume = lateLoans.reduce((sum: number, l: Loan) => sum + l.amount, 0);

      // Estimate monthly revenue (simplified)
      const monthlyRevenue = totalActiveVolume * 0.01; // 1% monthly

      // Collection rate
      const totalExpected = loans.length * 100000; // Simplified
      const totalCollected = totalExpected * 0.92;
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      setData({
        activeLoans,
        lateLoans,
        totalActiveVolume,
        totalLateVolume,
        monthlyRevenue,
        collectionRate,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Chyba pri načítaní reportov");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
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
              <a href="/dashboard" className="text-gray-600 hover:text-blue-900 transition">
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
              <a href="/dashboard/reports" className="text-blue-900 font-semibold border-b-2 border-blue-900 pb-1">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                Reporty
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
            <h2 className="text-3xl font-bold text-gray-900">Pokročilé reporty</h2>
            <p className="text-gray-600 mt-2">Prehľad výkonnosti a finančných ukazovateľov</p>
          </div>
          <Button onClick={fetchReportData} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktívne úvery</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeLoans.length}</div>
              <p className="text-xs text-gray-600 mt-1">
                €{(data.totalActiveVolume / 100).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meškajúce úvery</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.lateLoans.length}</div>
              <p className="text-xs text-gray-600 mt-1">
                €{(data.totalLateVolume / 100).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesačný príjem</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{(data.monthlyRevenue / 100).toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">+12% vs. minulý mesiac</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miera inkasa</CardTitle>
              <FileBarChart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 mt-1">Priemer za posledných 90 dní</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Loans Report */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Aktívne úvery</CardTitle>
                <CardDescription>Zoznam všetkých aktívnych úverov</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success("Export do CSV");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VS</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Suma</TableHead>
                  <TableHead>Začiatok</TableHead>
                  <TableHead>Koniec</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activeLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-mono">{loan.variableSymbol}</TableCell>
                    <TableCell>{loan.client.companyName || loan.client.contactPerson}</TableCell>
                    <TableCell className="font-semibold">
                      €{(loan.amount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>{new Date(loan.startDate).toLocaleDateString("sk-SK")}</TableCell>
                    <TableCell>{new Date(loan.endDate).toLocaleDateString("sk-SK")}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Aktívny
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Late Loans Report */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Meškajúce úvery</CardTitle>
                <CardDescription>Úvery s oneskorením platby</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success("Export do CSV");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VS</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Suma</TableHead>
                  <TableHead>Začiatok</TableHead>
                  <TableHead>Koniec</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lateLoans.length > 0 ? (
                  data.lateLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono">{loan.variableSymbol}</TableCell>
                      <TableCell>{loan.client.companyName || loan.client.contactPerson}</TableCell>
                      <TableCell className="font-semibold">
                        €{(loan.amount / 100).toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(loan.startDate).toLocaleDateString("sk-SK")}</TableCell>
                      <TableCell>{new Date(loan.endDate).toLocaleDateString("sk-SK")}</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Meškanie
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Žiadne meškajúce úvery
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

