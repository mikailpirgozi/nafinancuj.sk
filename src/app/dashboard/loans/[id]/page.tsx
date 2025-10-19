"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface Loan {
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
  client: {
    id: string;
    companyName: string | null;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  };
}

interface Installment {
  id: string;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paidAt: string | null;
}

interface Payment {
  id: string;
  createdAt: string;
  amount: number;
  variableSymbol: string;
  referenceNumber: string | null;
  status: string;
}

interface Collateral {
  id: string;
  type: string;
  description: string;
  estimatedValue: number;
  notes: string | null;
}

export default function LoanDetailPage() {
  const params = useParams();
  const loanId = params.id as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [collaterals, setCollaterals] = useState<Collateral[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLoanData();
  }, [loanId]);

  const fetchLoanData = async () => {
    try {
      setLoading(true);
      
      const [loanRes, paymentsRes, collateralsRes] = await Promise.all([
        fetch(`/api/loans/${loanId}`),
        fetch(`/api/payments?loanId=${loanId}`),
        fetch(`/api/collaterals?loanId=${loanId}`),
      ]);

      if (!loanRes.ok) throw new Error("Chyba pri načítaní úveru");

      const loanData = await loanRes.json();
      setLoan(loanData.data);
      setInstallments(loanData.data.installments || []);

      if (paymentsRes.ok) {
        const paymentData = await paymentsRes.json();
        setPayments(paymentData.data || []);
      }

      if (collateralsRes.ok) {
        const collateralData = await collateralsRes.json();
        setCollaterals(collateralData.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní dát");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !loan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam úver...</p>
        </div>
      </div>
    );
  }

  const clientName = loan.client?.companyName || loan.client?.contactPerson || "Neznámy klient";
  const paidInstallments = installments.filter((i) => i.status === "PAID").length;
  const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalAmount = installments.reduce((sum, i) => sum + i.totalAmount, 0);
  const progressPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/loans">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Úver #{loan.variableSymbol}</h1>
              <p className="text-slate-600">{clientName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchLoanData} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Loan Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left Card - Základné údaje */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Základné údaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Klient</p>
                <Link href={`/dashboard/clients/${loan.client.id}`} className="text-base font-semibold text-blue-600 hover:underline">
                  {clientName}
                </Link>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Typ produktu</p>
                <p className="text-base font-medium text-slate-900">{loan.productType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Trvanie</p>
                <p className="text-base font-medium text-slate-900">{loan.durationMonths} mesiacov</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <Badge className={
                  loan.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : loan.status === "LATE"
                    ? "bg-red-100 text-red-800"
                    : "bg-slate-100 text-slate-800"
                }>
                  {loan.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Right Card - Finančné údaje */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Finančné údaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Celková suma</p>
                <p className="text-2xl font-bold text-slate-900">€{(loan.amount / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Úroková sadzba</p>
                <p className="text-base font-medium text-slate-900">{loan.interestRateAnnual}% p.a.</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Začiatok / Koniec</p>
                <p className="text-base font-medium text-slate-900">
                  {format(new Date(loan.startDate), "dd.MM.yyyy", { locale: sk })} - {format(new Date(loan.endDate), "dd.MM.yyyy", { locale: sk })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Mesačná splátka</p>
                <p className="text-2xl font-bold text-emerald-600">
                  €{installments.length > 0 ? ((installments[0].totalAmount) / 100).toLocaleString() : "0"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Celkový pokrok</span>
                <span className="text-sm font-bold text-slate-900">{progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Zaplatené: €{(totalPaid / 100).toLocaleString()}</span>
                <span>Celkom: €{(totalAmount / 100).toLocaleString()}</span>
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-medium">{paidInstallments}</span>
                <span> z </span>
                <span className="font-medium">{installments.length}</span>
                <span> splátok zaplatených</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="installments" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="installments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Splátky ({installments.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Platby ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="collaterals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Kolaterály ({collaterals.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Dokumenty
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              História
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Installments */}
          <TabsContent value="installments" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Splátkový kalendár</CardTitle>
                <CardDescription>Všetky splátky úveru</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Splatnosť</TableHead>
                      <TableHead>Istina</TableHead>
                      <TableHead>Úrok</TableHead>
                      <TableHead>Celkom</TableHead>
                      <TableHead>Zaplatené</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst, idx) => (
                      <TableRow key={inst.id} className="border-slate-200/60 hover:bg-slate-50/60">
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{format(new Date(inst.dueDate), "dd.MM.yyyy", { locale: sk })}</TableCell>
                        <TableCell>€{(inst.principalAmount / 100).toLocaleString()}</TableCell>
                        <TableCell>€{(inst.interestAmount / 100).toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">€{(inst.totalAmount / 100).toLocaleString()}</TableCell>
                        <TableCell>€{(inst.paidAmount / 100).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            inst.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : inst.status === "PARTIALLY_PAID"
                              ? "bg-amber-100 text-amber-800"
                              : inst.status === "OVERDUE"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-800"
                          }>
                            {inst.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Payments */}
          <TabsContent value="payments" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>História platieb</CardTitle>
                    <CardDescription>Všetky zaznamenané platby</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nová platba
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne platby</h3>
                    <p className="text-slate-600">Zatiaľ neboli zaznamenané žiadne platby</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60 hover:bg-transparent">
                        <TableHead>Dátum</TableHead>
                        <TableHead>Suma</TableHead>
                        <TableHead>VS</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id} className="border-slate-200/60 hover:bg-slate-50/60">
                          <TableCell>{format(new Date(payment.createdAt), "dd.MM.yyyy")}</TableCell>
                          <TableCell className="font-semibold text-emerald-600">€{(payment.amount / 100).toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{payment.variableSymbol}</TableCell>
                          <TableCell className="text-slate-600">{payment.referenceNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-800">{payment.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Collaterals */}
          <TabsContent value="collaterals" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Kolaterály</CardTitle>
                    <CardDescription>Zabezpečenie úveru</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Pridať kolaterál
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {collaterals.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne kolaterály</h3>
                    <p className="text-slate-600">Úver nemá priradené žiadne kolaterály</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collaterals.map((collateral) => (
                      <Card key={collateral.id} className="border-2 border-slate-100 hover:border-blue-300 transition-colors">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <p className="text-sm text-slate-500">Typ</p>
                            <p className="font-semibold text-slate-900">{collateral.type}</p>
                            <p className="text-sm text-slate-500 mt-3">Popis</p>
                            <p className="text-slate-700">{collateral.description}</p>
                            <p className="text-sm text-slate-500 mt-3">Odhadovaná hodnota</p>
                            <p className="text-lg font-bold text-emerald-600">€{(collateral.estimatedValue / 100).toLocaleString()}</p>
                            {collateral.notes && (
                              <>
                                <p className="text-sm text-slate-500 mt-3">Poznámky</p>
                                <p className="text-slate-600">{collateral.notes}</p>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Documents */}
          <TabsContent value="documents" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dokumenty</CardTitle>
                    <CardDescription>Zmluvy a dokumenty úveru</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload dokument
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne dokumenty</h3>
                  <p className="text-slate-600">Zatiaľ nie sú nahrané žiadne dokumenty</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: History */}
          <TabsContent value="history" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>História zmien</CardTitle>
                <CardDescription>Chronologický prehľad všetkých zmien</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full"></div>
                      <div className="absolute left-2 top-4 w-0.5 h-16 bg-slate-200"></div>
                    </div>
                    <div className="pb-8">
                      <p className="font-semibold text-slate-900">Úver vytvorený</p>
                      <p className="text-sm text-slate-600">{format(new Date(loan.startDate), "dd.MM.yyyy HH:mm", { locale: sk })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

