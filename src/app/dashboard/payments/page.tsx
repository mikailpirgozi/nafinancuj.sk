"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Plus,
  RefreshCw,
  Upload,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface Payment {
  id: string;
  createdAt: string;
  amount: number;
  variableSymbol: string;
  referenceNumber: string | null;
  status: string;
  loanId?: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [vsFilter, setVsFilter] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Chyba pri načítaní platieb");

      const data = await response.json();
      setPayments(data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní platieb");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      const csvPayments = lines.slice(1).map((line) => {
        const [date, amount, vs, ref] = line.split(";");
        return {
          createdAt: new Date(date).toISOString(),
          amount: Math.round(parseFloat(amount.replace(",", ".")) * 100),
          variableSymbol: vs.trim(),
          referenceNumber: ref?.trim() || null,
        };
      });

      // Import do API
      const response = await fetch("/api/payments/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments: csvPayments }),
      });

      if (!response.ok) throw new Error("Chyba pri importe");

      const data = await response.json();
      setImportedCount(csvPayments.length);
      setMatchedCount(data.data?.matched || 0);
      toast.success(`Importované: ${csvPayments.length}, Spárované: ${data.data?.matched}`);
      setIsImportOpen(false);
      await fetchPayments();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri importe CSV");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Dátum", "Suma", "VS", "Referencia", "Status"],
      ...filteredPayments.map((p) => [
        format(new Date(p.createdAt), "dd.MM.yyyy"),
        (p.amount / 100).toFixed(2),
        p.variableSymbol,
        p.referenceNumber || "-",
        p.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platby-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (!mounted) return null;

  const filteredPayments = payments.filter((p) => {
    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.createdAt) > new Date(dateTo)) return false;
    if (vsFilter && !p.variableSymbol.includes(vsFilter)) return false;
    return true;
  });

  const unmatchedPayments = filteredPayments.filter((p) => p.status === "UNMATCHED");
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthAmount = filteredPayments
    .filter((p) => {
      const date = new Date(p.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = {
    totalIncome: totalAmount,
    thisMonth: thisMonthAmount,
    unmatchedCount: unmatchedPayments.length,
    avgPayment: payments.length > 0 ? Math.round(totalAmount / payments.length) : 0,
  };

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
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Platby</h1>
              <p className="text-slate-600">Správa a sledovanie platieb</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchPayments} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setIsImportOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Celkový príjem</CardTitle>
              <DollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">€{(stats.totalIncome / 100).toLocaleString()}</div>
              <p className="text-white/80 text-sm">Všetky platby</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Tento mesiac</CardTitle>
              <TrendingUp className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">€{(stats.thisMonth / 100).toLocaleString()}</div>
              <p className="text-white/80 text-sm">Mesačný príjem</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-600 to-amber-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Nepárované</CardTitle>
              <AlertCircle className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats.unmatchedCount}</div>
              <p className="text-white/80 text-sm">Vyžadujú párovanie</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Priemerná platba</CardTitle>
              <DollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">€{(stats.avgPayment / 100).toLocaleString()}</div>
              <p className="text-white/80 text-sm">Na platbu</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Od</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-slate-200" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Do</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-slate-200" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">VS</label>
                <Input placeholder="Hľadať VS..." value={vsFilter} onChange={(e) => setVsFilter(e.target.value)} className="border-slate-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Všetky platby ({filteredPayments.length})
            </TabsTrigger>
            <TabsTrigger value="unmatched" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Nepárované ({unmatchedPayments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Všetky platby</CardTitle>
                <CardDescription>Kompletný zoznam všetkých platieb</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne platby</h3>
                    <p className="text-slate-600">Zatiaľ nie sú zaznamenané žiadne platby</p>
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
                        <TableHead>Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-slate-200/60 hover:bg-slate-50/60">
                          <TableCell>{format(new Date(payment.createdAt), "dd.MM.yyyy", { locale: sk })}</TableCell>
                          <TableCell className="font-bold text-emerald-600">€{(payment.amount / 100).toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{payment.variableSymbol}</TableCell>
                          <TableCell className="text-slate-600">{payment.referenceNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge className={payment.status === "MATCHED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.loanId && (
                              <Link href={`/dashboard/loans/${payment.loanId}`}>
                                <Button size="sm" variant="outline" className="border-slate-200 hover:border-blue-300">
                                  Detail
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unmatched" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Nepárované platby</CardTitle>
                <CardDescription>Platby čakajúce na párovanie s úvermi</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {unmatchedPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Všetky platby sú spárované</h3>
                    <p className="text-slate-600">Niet nepárovaných platieb</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60 hover:bg-transparent">
                        <TableHead>Dátum</TableHead>
                        <TableHead>Suma</TableHead>
                        <TableHead>VS</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unmatchedPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-slate-200/60 hover:bg-slate-50/60">
                          <TableCell>{format(new Date(payment.createdAt), "dd.MM.yyyy", { locale: sk })}</TableCell>
                          <TableCell className="font-bold text-amber-600">€{(payment.amount / 100).toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{payment.variableSymbol}</TableCell>
                          <TableCell className="text-slate-600">{payment.referenceNumber || "-"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="border-slate-200 hover:border-blue-300">
                              Párovať
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Import Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Import platieb z CSV</DialogTitle>
              <DialogDescription>Nahrajte CSV súbor s platbami z vašej banky</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-900">Drag & drop súbor alebo kliknite</p>
                  <p className="text-sm text-slate-600">CSV formát z Tatry banky</p>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900">
                  <strong>Formát:</strong> Dátum;Suma;VS;Referencia
                </p>
              </div>

              {importedCount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                  <p className="text-sm text-emerald-900">
                    Importované: <strong>{importedCount}</strong> | Spárované: <strong>{matchedCount}</strong>
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isProcessing}>
                Zrušiť
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
