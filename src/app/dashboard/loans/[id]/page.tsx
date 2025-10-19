"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  FileText,
  TrendingUp,
  Wallet,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { InstallmentSchedule } from "@/components/installment-schedule";
import { PaymentForm } from "@/components/payment-form";
import { CollateralForm } from "@/components/collateral-form";
import { EarlyRepaymentDialog } from "@/components/early-repayment-dialog";

interface LoanData {
  loan: {
    id: string;
    variableSymbol: string;
    amount: number;
    interestRateAnnual: string;
    interestRateMonthly: string;
    productType: string;
    durationMonths: number;
    startDate: string;
    endDate: string;
    status: string;
    clientId: string;
    client?: {
      id: string;
      companyName: string | null;
      contactPerson: string;
      email: string | null;
      phone: string | null;
    };
  };
  installments: Array<{
    id: string;
    dueDate: string;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    paidAmount: number;
    status: string;
    paidAt: string | null;
  }>;
  summary: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    overdueCount: number;
    totalInstallments: number;
    paidInstallments: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  variableSymbol: string | null;
  paidAt: string;
  notes: string | null;
}

interface Collateral {
  id: string;
  type: string;
  description: string;
  estimatedValue: number;
  details: Record<string, unknown>;
  createdAt: string;
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;

  const [data, setData] = useState<LoanData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [collaterals, setCollaterals] = useState<Collateral[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isEarlyRepaymentOpen, setIsEarlyRepaymentOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLoanData();
    fetchPayments();
    fetchCollaterals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  const fetchLoanData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loans/${loanId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Chyba pri načítaní úveru");
      }

      setData(result.data);
    } catch (error) {
      console.error("Error fetching loan:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri načítaní úveru");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments?loanId=${loanId}`);
      const result = await response.json();
      setPayments(result.data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchCollaterals = async () => {
    try {
      const response = await fetch(`/api/collaterals?loanId=${loanId}`);
      const result = await response.json();
      setCollaterals(result.data || []);
    } catch (error) {
      console.error("Error fetching collaterals:", error);
    }
  };

  const handlePaymentSuccess = () => {
    fetchLoanData();
    fetchPayments();
    toast.success("Platba úspešne pridaná");
  };

  const handleCollateralSuccess = () => {
    fetchCollaterals();
    toast.success("Kolaterál úspešne pridaný");
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam detail úveru...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Úver sa nenašiel</p>
          <Button onClick={() => router.push("/dashboard/loans")} className="mt-4">
            Späť na zoznam úverov
          </Button>
        </div>
      </div>
    );
  }

  const { loan, installments, summary } = data;
  const clientName = loan.client?.companyName || loan.client?.contactPerson || "Neznámy klient";

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
                <Link href="/dashboard/loans" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:scale-105">
                  <FileBarChart className="inline h-4 w-4 mr-2" />
                  Úvery
                </Link>
                <Link href="/dashboard/applications" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Žiadosti
                </Link>
                <Link href="/dashboard/reports" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
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
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/loans")}
          className="mb-6 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na zoznam úverov
        </Button>

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-bold text-slate-900">Úver #{loan.variableSymbol}</h2>
                <Badge
                  variant={
                    loan.status === "ACTIVE"
                      ? "default"
                      : loan.status === "LATE"
                      ? "destructive"
                      : "secondary"
                  }
                  className={`text-lg px-4 py-1 ${
                    loan.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : ""
                  }`}
                >
                  {loan.status}
                </Badge>
              </div>
              <p className="text-slate-600 text-lg">Detail úveru a splátkový kalendár</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchLoanData}
                variant="outline"
                className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Obnoviť
              </Button>
              <Button
                onClick={() => setIsEarlyRepaymentOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30"
                disabled={loan.status === "CLOSED" || summary.remainingAmount === 0}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Predčasné splatenie
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Celková suma</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">€{(summary.totalAmount / 100).toLocaleString()}</div>
              <p className="text-sm text-white/80 mt-2">Istina + úrok</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Zaplatené</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">€{(summary.paidAmount / 100).toLocaleString()}</div>
              <p className="text-sm text-white/80 mt-2">
                {summary.paidInstallments} z {summary.totalInstallments} splátok
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Zostáva</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">€{(summary.remainingAmount / 100).toLocaleString()}</div>
              <p className="text-sm text-white/80 mt-2">
                {((summary.paidAmount / summary.totalAmount) * 100).toFixed(1)}% splatené
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-red-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Omeškané</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{summary.overdueCount}</div>
              <p className="text-sm text-white/80 mt-2">Omeškajúcich splátok</p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Info Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-blue-600" />
              Informácie o úvere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Klient</p>
                <button
                  onClick={() => router.push(`/dashboard/clients/${loan.clientId}`)}
                  className="flex items-center gap-2 text-blue-600 hover:underline font-semibold"
                >
                  <Building2 className="h-4 w-4" />
                  {clientName}
                </button>
                {loan.client?.email && (
                  <a href={`mailto:${loan.client.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mt-1">
                    <Mail className="h-3 w-3" />
                    {loan.client.email}
                  </a>
                )}
                {loan.client?.phone && (
                  <a href={`tel:${loan.client.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mt-1">
                    <Phone className="h-3 w-3" />
                    {loan.client.phone}
                  </a>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Suma úveru</p>
                <p className="text-2xl font-bold text-slate-900">€{(loan.amount / 100).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Úroková sadzba</p>
                <p className="text-xl font-semibold text-slate-900">{loan.interestRateAnnual}% p.a.</p>
                <p className="text-sm text-slate-600">{loan.interestRateMonthly}% mesačne</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Typ úveru</p>
                <Badge variant="outline" className="text-sm">
                  {loan.productType === "AMORTIZING" ? "Amortizačný" : "Úrokový"}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Doba trvania</p>
                <p className="text-lg font-semibold text-slate-900">{loan.durationMonths} mesiacov</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Obdobie</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(loan.startDate).toLocaleDateString("sk-SK")} - {new Date(loan.endDate).toLocaleDateString("sk-SK")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="installments" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="installments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Splátkový kalendár
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Platby ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="collaterals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Kolaterály ({collaterals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="installments" className="mt-6">
            <InstallmentSchedule 
              installments={installments} 
              loanId={loanId}
              onPaymentAdded={fetchLoanData}
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentForm
              loanId={loanId}
              variableSymbol={loan.variableSymbol}
              onSuccess={handlePaymentSuccess}
            />
            {/* Payment history will be added here */}
          </TabsContent>

          <TabsContent value="collaterals" className="mt-6">
            <CollateralForm loanId={loanId} onSuccess={handleCollateralSuccess} />
            {/* Collateral list will be added here */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Early Repayment Dialog */}
      <EarlyRepaymentDialog
        open={isEarlyRepaymentOpen}
        onOpenChange={setIsEarlyRepaymentOpen}
        loanId={loanId}
        variableSymbol={loan.variableSymbol}
        installments={installments}
        onSuccess={() => {
          fetchLoanData();
          fetchPayments();
        }}
      />
    </div>
  );
}

