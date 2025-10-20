"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Download,
  RefreshCw,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { OverdueInstallmentsTable } from "@/components/overdue-installments-table";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
}

interface ReminderPolicy {
  id: string;
  daysAfterDue: number;
  reminderType: string;
  feeType: string;
  feeAmount: string;
}

interface Reminder {
  id: string;
  sentAt: string;
  feeCharged: number;
  policy: ReminderPolicy;
}

interface OverdueInstallment {
  id: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  paidAt: string | null;
  daysOverdue: number;
  remindersSent: number;
  loan: {
    id: string;
    variableSymbol: string;
    interestRateAnnual: string;
  };
  client: {
    id: string;
    companyName: string | null;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  };
  payments?: Payment[];
  reminders?: Reminder[];
}

export default function OverduePage() {
  const [installments, setInstallments] = useState<OverdueInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [daysFilter, setDaysFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchOverdueInstallments();
  }, []);

  const fetchOverdueInstallments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/installments/overdue");
      if (!response.ok) throw new Error("Chyba pri načítaní dát");

      const data = await response.json();
      setInstallments(data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní dát");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    if (selectedIds.size === 0) {
      toast.error("Vyberte aspoň jednu splátku");
      return;
    }

    try {
      setIsSendingReminders(true);
      const response = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentIds: Array.from(selectedIds) }),
      });

      if (!response.ok) throw new Error("Chyba pri odosielaní upomienok");

      const data = await response.json();
      toast.success(`Odoslané: ${data.data.remindersSent} upomienok`);
      setSelectedIds(new Set());
      await fetchOverdueInstallments();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri odosielaní upomienok");
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Klient", "VS", "Splatnosť", "Suma", "Zaplatené", "Dní omeškania", "Upomienky"],
      ...filteredInstallments.map((inst) => [
        inst.client.companyName || inst.client.contactPerson,
        inst.loan.variableSymbol,
        format(new Date(inst.dueDate), "dd.MM.yyyy"),
        (inst.totalAmount / 100).toFixed(2),
        (inst.paidAmount / 100).toFixed(2),
        inst.daysOverdue,
        inst.remindersSent,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omesskane-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (!mounted) {
    return null;
  }

  const filteredInstallments = installments.filter((inst) => {
    // Safety check: skip if missing required data
    if (!inst || !inst.client || !inst.loan) {
      return false;
    }

    if (daysFilter !== "all") {
      const [minDays, maxDays] = daysFilter.split("-").map(Number);
      if (inst.daysOverdue < minDays || (maxDays && inst.daysOverdue > maxDays)) {
        return false;
      }
    }
    if (clientFilter && !inst.client.companyName?.toLowerCase().includes(clientFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    count: filteredInstallments.length,
    totalAmount: filteredInstallments.reduce((sum, inst) => sum + (inst.totalAmount - inst.paidAmount), 0),
    avgDaysOverdue: filteredInstallments.length > 0
      ? Math.round(filteredInstallments.reduce((sum, inst) => sum + inst.daysOverdue, 0) / filteredInstallments.length)
      : 0,
    clientsCount: new Set(filteredInstallments.map((inst) => inst.client.id)).size,
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
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Omeškané splátky</h1>
              <p className="text-slate-600">Správa omeškajúcich splátek a upomienok</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchOverdueInstallments} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {selectedIds.size > 0 && (
              <Button onClick={handleSendReminders} disabled={isSendingReminders} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-500/30">
                <Bell className="mr-2 h-4 w-4" />
                Odoslať upomienky ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-600 to-red-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Počet omeškajúcich</CardTitle>
              <AlertCircle className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats.count}</div>
              <p className="text-white/80 text-sm">Splátek</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-600 to-amber-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Celková suma</CardTitle>
              <DollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">€{(stats.totalAmount / 100).toLocaleString()}</div>
              <p className="text-white/80 text-sm">Nezaplatené</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Priemerné omeškanie</CardTitle>
              <TrendingDown className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats.avgDaysOverdue}</div>
              <p className="text-white/80 text-sm">Dní</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Počet klientov</CardTitle>
              <Bell className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats.clientsCount}</div>
              <p className="text-white/80 text-sm">S omeškaniami</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Počet dní omeškania</label>
                <Select value={daysFilter} onValueChange={setDaysFilter}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetko</SelectItem>
                    <SelectItem value="0-7">Menej ako 7 dní</SelectItem>
                    <SelectItem value="7-14">7-14 dní</SelectItem>
                    <SelectItem value="15-30">15-30 dní</SelectItem>
                    <SelectItem value="30-999">Viac ako 30 dní</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Klient</label>
                <Input
                  placeholder="Hľadať klienta..."
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="border-slate-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b border-slate-200/60">
            <CardTitle>Tabuľka omeškajúcich splátek</CardTitle>
            <CardDescription>Všetky omeškané splátky s detailami</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredInstallments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne omeškane splátky</h3>
                <p className="text-slate-600">Gratulujem! Žiadne splátky nie sú v omeskani.</p>
              </div>
            ) : (
              <OverdueInstallmentsTable
                installments={filteredInstallments}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onPaymentAdded={fetchOverdueInstallments}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

