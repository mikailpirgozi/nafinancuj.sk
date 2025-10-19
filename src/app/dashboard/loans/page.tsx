"use client";

import { useState, useEffect } from "react";
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
  RefreshCw,
  TrendingUp,
  Wallet,
  FileText,
  Plus,
  Download,
  FileBarChart,
} from "lucide-react";
import { LoanFormDialog } from "@/components/loan-form-dialog";
import { DashboardHeader } from "@/components/dashboard-header";
import { toast } from "sonner";
import { exportLoansToCSV } from "@/lib/csv-export";

interface Loan {
  id: string;
  variableSymbol: string;
  amount: number;
  interestRateAnnual: string;
  productType: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: string;
  client: {
    companyName: string | null;
    contactPerson: string;
  };
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/loans");
      const data = await response.json();
      setLoans(data.data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Chyba pri načítaní úverov");
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = loans.reduce((sum, loan) => sum + loan.amount, 0) / 100;
  const activeLoans = loans.filter((l) => l.status === "ACTIVE").length;
  const avgInterestRate = loans.length
    ? (loans.reduce((sum, l) => sum + parseFloat(l.interestRateAnnual), 0) / loans.length).toFixed(2)
    : 0;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader currentPage="loans" />

      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Načítavam úvery...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-2">Úvery</h2>
                <p className="text-slate-600 text-lg">Správa všetkých poskytnutých úverov</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={fetchLoans} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Obnoviť
                </Button>
                <Button
                  onClick={() => {
                    try {
                      exportLoansToCSV(loans);
                      toast.success(`Exportovaných ${loans.length} úverov do CSV`);
                    } catch {
                      toast.error("Chyba pri exporte");
                    }
                  }}
                  variant="outline"
                  disabled={loans.length === 0}
                  className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nový úver
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Celkový objem</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">€{totalVolume.toLocaleString()}</div>
                  <p className="text-white/80 mt-1">{loans.length} úverov</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Aktívne úvery</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{activeLoans}</div>
                  <p className="text-white/80 mt-1">
                    {loans.length ? ((activeLoans / loans.length) * 100).toFixed(1) : 0}% z celku
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-white/90">Priemerná úroková sadzba</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <FileBarChart className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{avgInterestRate}%</div>
                  <p className="text-white/80 mt-1">ročne</p>
                </CardContent>
              </Card>
            </div>

            {/* Loans Table */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Zoznam úverov</CardTitle>
                <CardDescription>Všetky poskytnuté úvery v jednom prehľade</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
                      <TableHead>VS</TableHead>
                      <TableHead>Klient</TableHead>
                      <TableHead>Suma</TableHead>
                      <TableHead>Úrok</TableHead>
                      <TableHead>Trvanie</TableHead>
                      <TableHead>Začiatok</TableHead>
                      <TableHead>Koniec</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow
                        key={loan.id}
                        className="cursor-pointer hover:bg-slate-50/60 border-slate-200/60"
                        onClick={() => (window.location.href = `/dashboard/loans/${loan.id}`)}
                      >
                        <TableCell className="font-mono font-semibold text-blue-600">{loan.variableSymbol}</TableCell>
                        <TableCell className="font-medium">{loan.client.companyName || loan.client.contactPerson}</TableCell>
                        <TableCell className="font-semibold">€{(loan.amount / 100).toLocaleString()}</TableCell>
                        <TableCell>{loan.interestRateAnnual}% p.a.</TableCell>
                        <TableCell>{loan.durationMonths} mesiacov</TableCell>
                        <TableCell>{new Date(loan.startDate).toLocaleDateString("sk-SK")}</TableCell>
                        <TableCell>{new Date(loan.endDate).toLocaleDateString("sk-SK")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              loan.status === "ACTIVE"
                                ? "default"
                                : loan.status === "LATE"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={
                              loan.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : loan.status === "LATE"
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                            }
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {loans.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne úvery</h3>
                    <p className="text-slate-600 mb-4">Začnite poskytnutím vášho prvého úveru</p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Vytvoriť úver
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <LoanFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchLoans}
      />
    </div>
  );
}
