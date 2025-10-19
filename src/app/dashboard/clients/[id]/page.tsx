"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  FileText,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit,
  Trash2,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface ClientData {
  client: {
    id: string;
    companyName: string | null;
    ico: string | null;
    dic: string | null;
    contactPerson: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    employeesCount: number | null;
    annualRevenue: number | null;
    foundedAt: string | null;
    notes: string | null;
    createdAt: string;
  };
  loans: Array<{
    id: string;
    variableSymbol: string;
    amount: number;
    status: string;
    startDate: string;
  }>;
  applications: Array<{
    id: string;
    amount: number;
    purpose: string;
    status: string;
    createdAt: string;
  }>;
  loansCount: number;
  activeLoansCount: number;
  applicationsCount: number;
  approvedApplicationsCount: number;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    ico: "",
    dic: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    employeesCount: "",
    annualRevenue: "",
    foundedAt: "",
    notes: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Chyba pri načítaní klienta");
      }

      setData(result.data);
      
      // Initialize form data
      const client = result.data.client;
      setFormData({
        companyName: client.companyName || "",
        ico: client.ico || "",
        dic: client.dic || "",
        contactPerson: client.contactPerson || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        postalCode: client.postalCode || "",
        employeesCount: client.employeesCount?.toString() || "",
        annualRevenue: client.annualRevenue ? (client.annualRevenue / 100).toString() : "",
        foundedAt: client.foundedAt || "",
        notes: client.notes || "",
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri načítaní klienta");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        companyName: formData.companyName || null,
        ico: formData.ico || null,
        dic: formData.dic || null,
        contactPerson: formData.contactPerson,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        employeesCount: formData.employeesCount ? parseInt(formData.employeesCount) : null,
        annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) * 100 : null,
        foundedAt: formData.foundedAt || null,
        notes: formData.notes || null,
      };

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri aktualizácii klienta");
      }

      toast.success("Klient úspešne aktualizovaný!");
      setIsEditOpen(false);
      await fetchClientData();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri aktualizácii klienta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri mazaní klienta");
      }

      toast.success("Klient úspešne zmazaný!");
      router.push("/dashboard/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri mazaní klienta");
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
          <p className="text-slate-600 font-medium">Načítavam detail klienta...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Klient sa nenašiel</p>
          <Button onClick={() => router.push("/dashboard/clients")} className="mt-4">
            Späť na zoznam klientov
          </Button>
        </div>
      </div>
    );
  }

  const { client, loans, applications } = data;
  const clientName = client.companyName || client.contactPerson;
  const totalLoanVolume = loans.reduce((sum, loan) => sum + loan.amount, 0) / 100;

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
                <Link href="/dashboard/clients" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:scale-105">
                  <Users className="inline h-4 w-4 mr-2" />
                  Klienti
                </Link>
                <Link href="/dashboard/loans" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
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
          onClick={() => router.push("/dashboard/clients")}
          className="mb-6 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na zoznam klientov
        </Button>

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">{clientName}</h2>
              <p className="text-slate-600 text-lg">Detail klienta a história úverov</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchClientData}
                variant="outline"
                className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Obnoviť
              </Button>
              <Button
                onClick={() => setIsEditOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
              >
                <Edit className="mr-2 h-4 w-4" />
                Upraviť
              </Button>
              <Button
                onClick={() => setIsDeleteOpen(true)}
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Zmazať
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Celkový objem úverov</CardTitle>
              <DollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">€{totalLoanVolume.toLocaleString()}</div>
              <p className="text-sm text-white/80 mt-2">{data.loansCount} úverov</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Aktívne úvery</CardTitle>
              <FileBarChart className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{data.activeLoansCount}</div>
              <p className="text-sm text-white/80 mt-2">Práve bežiace</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Žiadosti</CardTitle>
              <FileText className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{data.applicationsCount}</div>
              <p className="text-sm text-white/80 mt-2">{data.approvedApplicationsCount} schválených</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Klient od</CardTitle>
              <Calendar className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-lg font-bold">
                {new Date(client.createdAt).toLocaleDateString("sk-SK")}
              </div>
              <p className="text-sm text-white/80 mt-2">Dátum registrácie</p>
            </CardContent>
          </Card>
        </div>

        {/* Client Info Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Informácie o klientovi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {client.companyName && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Názov firmy</p>
                  <p className="text-lg font-semibold text-slate-900">{client.companyName}</p>
                </div>
              )}
              {client.ico && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">IČO</p>
                  <p className="text-lg font-mono text-slate-900">{client.ico}</p>
                </div>
              )}
              {client.dic && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">DIČ</p>
                  <p className="text-lg font-mono text-slate-900">{client.dic}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500 mb-1">Kontaktná osoba</p>
                <p className="text-lg font-semibold text-slate-900">{client.contactPerson}</p>
              </div>
              {client.email && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Telefón</p>
                  <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </a>
                </div>
              )}
              {client.address && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Adresa</p>
                  <p className="flex items-center gap-2 text-slate-900">
                    <MapPin className="h-4 w-4" />
                    {client.address}
                    {client.city && `, ${client.city}`}
                    {client.postalCode && `, ${client.postalCode}`}
                  </p>
                </div>
              )}
              {client.employeesCount && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Počet zamestnancov</p>
                  <p className="flex items-center gap-2 text-slate-900">
                    <Briefcase className="h-4 w-4" />
                    {client.employeesCount}
                  </p>
                </div>
              )}
              {client.annualRevenue && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ročný obrat</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    €{(client.annualRevenue / 100).toLocaleString()}
                  </p>
                </div>
              )}
              {client.foundedAt && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Dátum založenia</p>
                  <p className="text-slate-900">{new Date(client.foundedAt).toLocaleDateString("sk-SK")}</p>
                </div>
              )}
            </div>
            {client.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-slate-500 mb-2">Poznámky</p>
                <p className="text-slate-900 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="loans" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="loans" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Úvery ({loans.length})
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Žiadosti ({applications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>História úverov</CardTitle>
                <CardDescription>Všetky úvery tohto klienta</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VS</TableHead>
                      <TableHead>Suma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dátum začiatku</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow 
                        key={loan.id} 
                        className="cursor-pointer hover:bg-blue-50/50"
                        onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                      >
                        <TableCell className="font-mono font-semibold">{loan.variableSymbol}</TableCell>
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
                {loans.length === 0 && (
                  <div className="text-center py-12">
                    <FileBarChart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Žiadne úvery</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>História žiadostí</CardTitle>
                <CardDescription>Všetky žiadosti tohto klienta</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Účel</TableHead>
                      <TableHead>Suma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vytvorené</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow 
                        key={app.id} 
                        className="cursor-pointer hover:bg-blue-50/50"
                        onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                      >
                        <TableCell>{app.purpose}</TableCell>
                        <TableCell className="font-semibold">€{(app.amount / 100).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge>{app.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(app.createdAt).toLocaleDateString("sk-SK")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {applications.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Žiadne žiadosti</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog - Zkrátená verzia kvôli tokenom */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upraviť klienta</DialogTitle>
            <DialogDescription>Aktualizujte údaje klienta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Názov firmy</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Kontaktná osoba *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefón</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
                Zrušiť
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Ukladám...
                  </>
                ) : (
                  "Uložiť zmeny"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmazať klienta?</DialogTitle>
            <DialogDescription>
              Naozaj chcete zmazať klienta <strong>{clientName}</strong>? Táto akcia je nevratná a zmaže aj všetky súvisiace dáta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Zrušiť
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Mažem...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Zmazať klienta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

