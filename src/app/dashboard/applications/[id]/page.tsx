"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  FileText,
  TrendingUp,
  Sparkles,
  CheckCircle,
  DollarSign,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface ApplicationData {
  id: string;
  clientId: string;
  amount: number;
  purpose: string;
  status: string;
  durationMonths: number;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    companyName: string | null;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  };
}

const STATUS_LABELS = {
  NEW: "Nová",
  REVIEWING: "V kontrole",
  DOCUMENTS_REQUESTED: "Dokumenty požadované",
  PENDING_APPROVAL: "Čaká na schválenie",
  APPROVED: "Schválená",
  REJECTED: "Zamietnutá",
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [convertFormData, setConvertFormData] = useState({
    interestRateAnnual: "12.5",
    productType: "AMORTIZING" as "AMORTIZING" | "INTEREST_ONLY",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setMounted(true);
    fetchApplicationData();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Chyba pri načítaní žiadosti");
      }

      setData(result.data);
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri načítaní žiadosti");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Chyba pri zmene statusu");
      }

      toast.success("Status úspešne zmenený");
      await fetchApplicationData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Chyba pri zmene statusu");
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedUserId) {
      toast.error("Vyberte agenta");
      return;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        throw new Error("Chyba pri priraďovaní agenta");
      }

      toast.success("Agent úspešne priradený");
      setIsAssignDialogOpen(false);
      await fetchApplicationData();
    } catch (error) {
      console.error("Error assigning agent:", error);
      toast.error("Chyba pri priraďovaní agenta");
    }
  };

  const handleConvertToLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setIsSubmitting(true);

    try {
      const payload = {
        clientId: data.clientId,
        amount: data.amount,
        interestRateAnnual: convertFormData.interestRateAnnual,
        interestRateMonthly: (parseFloat(convertFormData.interestRateAnnual) / 12).toFixed(2),
        productType: convertFormData.productType,
        durationMonths: data.durationMonths,
        startDate: convertFormData.startDate,
      };

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní úveru");
      }

      const result = await response.json();
      toast.success("Úver úspešne vytvorený!");
      
      // Update application status to APPROVED
      await handleStatusChange("APPROVED");
      
      // Redirect to loan detail
      router.push(`/dashboard/loans/${result.data.id}`);
    } catch (error) {
      console.error("Error converting to loan:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní úveru");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam detail žiadosti...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Žiadosť sa nenašla</p>
          <Button onClick={() => router.push("/dashboard/applications")} className="mt-4">
            Späť na zoznam žiadostí
          </Button>
        </div>
      </div>
    );
  }

  const clientName = data.client?.companyName || data.client?.contactPerson || "Neznámy klient";

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
                <Link href="/dashboard/loans" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileBarChart className="inline h-4 w-4 mr-2" />
                  Úvery
                </Link>
                <Link href="/dashboard/applications" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:scale-105">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Žiadosti
                </Link>
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
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/applications")}
          className="mb-6 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na zoznam žiadostí
        </Button>

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-bold text-slate-900">Žiadosť o úver</h2>
                <Badge className="text-lg px-4 py-1">
                  {STATUS_LABELS[data.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
              <p className="text-slate-600 text-lg">Detail žiadosti a správa dokumentov</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchApplicationData}
                variant="outline"
                className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Obnoviť
              </Button>
              {data.status === "APPROVED" && (
                <Button
                  onClick={() => setIsConvertOpen(true)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Konvertovať na úver
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Application Info Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Informácie o žiadosti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Klient</p>
                <button
                  onClick={() => router.push(`/dashboard/clients/${data.clientId}`)}
                  className="text-blue-600 hover:underline font-semibold text-lg"
                >
                  {clientName}
                </button>
                {data.client?.email && (
                  <p className="text-sm text-slate-600 mt-1">{data.client.email}</p>
                )}
                {data.client?.phone && (
                  <p className="text-sm text-slate-600">{data.client.phone}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Požadovaná suma</p>
                <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  €{(data.amount / 100).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Doba trvania</p>
                <p className="text-xl font-semibold text-slate-900">{data.durationMonths} mesiacov</p>
              </div>

              <div className="col-span-full">
                <p className="text-sm text-slate-500 mb-1">Účel úveru</p>
                <p className="text-lg text-slate-900">{data.purpose}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Vytvorené</p>
                <p className="flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4" />
                  {new Date(data.createdAt).toLocaleDateString("sk-SK")}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Aktualizované</p>
                <p className="flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4" />
                  {new Date(data.updatedAt).toLocaleDateString("sk-SK")}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Pridelený agent</p>
                <div className="flex items-center gap-3">
                  <p className="flex items-center gap-2 text-slate-900">
                    <User className="h-4 w-4" />
                    {data.assignedToUserId || "Nepriradené"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="border-blue-300 hover:bg-blue-50"
                  >
                    {data.assignedToUserId ? "Zmeniť" : "Priradiť"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Management Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Správa statusu</CardTitle>
            <CardDescription>Zmeňte status žiadosti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="status">Nový status:</Label>
              <Select value={data.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Nová</SelectItem>
                  <SelectItem value="REVIEWING">V kontrole</SelectItem>
                  <SelectItem value="DOCUMENTS_REQUESTED">Dokumenty požadované</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Čaká na schválenie</SelectItem>
                  <SelectItem value="APPROVED">Schválená</SelectItem>
                  <SelectItem value="REJECTED">Zamietnutá</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        {data.status === "APPROVED" && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4 border-l-emerald-600">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Žiadosť schválená</h3>
                  <p className="text-emerald-800 mb-4">
                    Táto žiadosť bola schválená a môže byť konvertovaná na úver. Kliknite na tlačidlo &quot;Konvertovať na úver&quot; pre vytvorenie úveru.
                  </p>
                  <Button
                    onClick={() => setIsConvertOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Konvertovať na úver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assign Agent Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Priradiť agenta</DialogTitle>
            <DialogDescription>
              Vyberte agenta, ktorý bude spracovávať túto žiadosť
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="agent">Agent</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte agenta" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Zrušiť
            </Button>
            <Button
              type="button"
              onClick={handleAssignAgent}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Priradiť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Loan Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Konvertovať na úver</DialogTitle>
            <DialogDescription>
              Vytvorte úver zo schválenej žiadosti. Suma a doba trvania budú prevzaté zo žiadosti.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConvertToLoan}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRateAnnual">
                    Úroková sadzba (% p.a.) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="interestRateAnnual"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={convertFormData.interestRateAnnual}
                    onChange={(e) =>
                      setConvertFormData({ ...convertFormData, interestRateAnnual: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">
                    Typ úveru <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={convertFormData.productType}
                    onValueChange={(value: "AMORTIZING" | "INTEREST_ONLY") =>
                      setConvertFormData({ ...convertFormData, productType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AMORTIZING">Amortizačný</SelectItem>
                      <SelectItem value="INTEREST_ONLY">Úrokový</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="startDate">
                    Dátum začiatku <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={convertFormData.startDate}
                    onChange={(e) =>
                      setConvertFormData({ ...convertFormData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Náhľad úveru</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Suma:</p>
                    <p className="font-semibold text-blue-900">€{(data.amount / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Doba trvania:</p>
                    <p className="font-semibold text-blue-900">{data.durationMonths} mesiacov</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Úrok:</p>
                    <p className="font-semibold text-blue-900">{convertFormData.interestRateAnnual}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Typ:</p>
                    <p className="font-semibold text-blue-900">
                      {convertFormData.productType === "AMORTIZING" ? "Amortizačný" : "Úrokový"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConvertOpen(false)}
                disabled={isSubmitting}
              >
                Zrušiť
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Vytváram...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Vytvoriť úver
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

