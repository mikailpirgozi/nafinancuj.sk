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
  Wallet,
  FileText,
  Plus,
} from "lucide-react";
import { LoanFormDialog } from "@/components/loan-form-dialog";
import { toast } from "sonner";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/loans");
      const data = await response.json();
      setLoans(data.loans || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Chyba pri načítaní úverov");
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = loans.reduce((sum, loan) => sum + loan.amount, 0) / 100;
  const activeLoans = loans.filter((l) => l.status === "ACTIVE").length;

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
              <a href="/dashboard" className="text-gray-600 hover:text-blue-900 transition">
                Dashboard
              </a>
              <a href="/dashboard/clients" className="text-gray-600 hover:text-blue-900 transition">
                <Users className="inline h-4 w-4 mr-1" />
                Klienti
              </a>
              <a href="/dashboard/loans" className="text-blue-900 font-semibold border-b-2 border-blue-900 pb-1">
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
            <h2 className="text-3xl font-bold text-gray-900">Úvery</h2>
            <p className="text-gray-600 mt-2">Správa všetkých poskytnutých úverov</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchLoans} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-900 to-blue-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nový úver
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkový objem</CardTitle>
              <Wallet className="h-4 w-4 text-blue-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalVolume.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{loans.length} úverov</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktívne úvery</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans}</div>
              <p className="text-xs text-gray-500 mt-1">
                {loans.length ? ((activeLoans / loans.length) * 100).toFixed(1) : 0}% z celku
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Priemerná úroková sadzba</CardTitle>
              <FileBarChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loans.length
                  ? (
                      loans.reduce((sum, l) => sum + parseFloat(l.interestRateAnnual), 0) /
                      loans.length
                    ).toFixed(2)
                  : 0}
                %
              </div>
              <p className="text-xs text-gray-500 mt-1">ročne</p>
            </CardContent>
          </Card>
        </div>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Zoznam úverov</CardTitle>
            <CardDescription>Všetky poskytnuté úvery v jednom prehľade</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={loan.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-mono font-semibold">{loan.variableSymbol}</TableCell>
                    <TableCell>{loan.client.companyName || loan.client.contactPerson}</TableCell>
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
                <FileBarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Žiadne úvery</h3>
                <p className="text-gray-600 mb-4">Začnite poskytnutím vášho prvého úveru</p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-900 to-blue-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Vytvoriť úver
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loan Form Dialog */}
      <LoanFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchLoans}
      />
    </div>
  );
}

