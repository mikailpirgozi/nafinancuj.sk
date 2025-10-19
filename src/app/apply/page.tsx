"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Building2,
  Phone,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface FormData {
  companyName: string;
  ico: string;
  contactPerson: string;
  email: string;
  phone: string;
  amount: string;
  purpose: string;
  durationMonths: string;
  // Complex form fields
  dic?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  legalForm?: string;
  yearEstablished?: string;
  numberOfEmployees?: string;
  annualRevenue?: string;
  monthlyRevenue?: string;
  monthlyExpenses?: string;
  existingLoans?: string;
  collateralType?: string;
  collateralValue?: string;
  collateralDescription?: string;
}

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [useComplexForm, setUseComplexForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    ico: "",
    contactPerson: "",
    email: "",
    phone: "",
    amount: "",
    purpose: "",
    durationMonths: "12",
    // Complex form fields
    dic: "",
    address: "",
    city: "",
    zipCode: "",
    legalForm: "sro",
    yearEstablished: "",
    numberOfEmployees: "",
    annualRevenue: "",
    monthlyRevenue: "",
    monthlyExpenses: "",
    existingLoans: "",
    collateralType: "",
    collateralValue: "",
    collateralDescription: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First create client
      const clientPayload = {
        companyName: formData.companyName || null,
        ico: formData.ico || null,
        contactPerson: formData.contactPerson,
        email: formData.email || null,
        phone: formData.phone || null,
      };

      const clientResponse = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientPayload),
      });

      if (!clientResponse.ok) {
        throw new Error("Chyba pri vytváraní klienta");
      }

      const clientResult = await clientResponse.json();
      const clientId = clientResult.data.id;

      // Then create application
      const applicationPayload = {
        clientId,
        amount: Math.round(parseFloat(formData.amount) * 100),
        purpose: formData.purpose,
        durationMonths: parseInt(formData.durationMonths),
      };

      const appResponse = await fetch("/api/public/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationPayload),
      });

      if (!appResponse.ok) {
        throw new Error("Chyba pri vytváraní žiadosti");
      }

      setIsSuccess(true);
      toast.success("Žiadosť úspešne odoslaná!");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri odosielaní žiadosti");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Žiadosť úspešne odoslaná!</h2>
              <p className="text-lg text-slate-600 mb-6">
                Ďakujeme za vašu žiadosť o úver. Náš tím ju spracuje v najbližších 24 hodinách.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Čo sa stane ďalej?</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span>Overíme vaše údaje a dokumenty</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span>Kontaktujeme vás pre doplňujúce informácie (ak je potrebné)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span>Zašleme vám rozhodnutie o schválení úveru</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => window.location.href = "/"}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              Späť na hlavnú stránku
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white to-blue-50 flex items-center justify-center shadow-2xl">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-5xl font-bold text-white">
              Nafinancuj.sk
            </h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Podnikateľský úver na mieru
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Rýchle schválenie, flexibilné podmienky a konkurenčné úrokové sadzby pre váš biznis
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Rýchle schválenie</h3>
              <p className="text-slate-600">Rozhodnutie do 24 hodín od podania žiadosti</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Nízke úroky</h3>
              <p className="text-slate-600">Konkurenčné úrokové sadzby od 8.5% p.a.</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bezpečné</h3>
              <p className="text-slate-600">Vaše údaje sú v bezpečí a chránené</p>
            </CardContent>
          </Card>
        </div>

        {/* Form Type Selection */}
        <div className="max-w-5xl mx-auto mb-8">
          <h3 className="text-2xl font-bold text-center text-white mb-6">Vyberte typ formulára</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setUseComplexForm(false)}
              className={`p-6 rounded-2xl border-4 transition-all ${
                !useComplexForm
                  ? "border-blue-500 bg-white shadow-2xl scale-105"
                  : "border-white/30 bg-white/80 hover:border-white/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold text-slate-900">Jednoduchý formulár</h4>
                {!useComplexForm && (
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <p className="text-slate-600 mb-4">
                Rýchle vyplnenie základných údajov. Ideálne pre prvý kontakt.
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Základné firemné údaje</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Kontaktné informácie</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Požadovaná suma a účel</span>
                </li>
              </ul>
              <div className="mt-4 text-sm font-semibold text-blue-600">
                ⏱️ Vyplnenie: ~2 minúty
              </div>
            </button>

            <button
              onClick={() => setUseComplexForm(true)}
              className={`p-6 rounded-2xl border-4 transition-all ${
                useComplexForm
                  ? "border-emerald-500 bg-white shadow-2xl scale-105"
                  : "border-white/30 bg-white/80 hover:border-white/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold text-slate-900">Komplexný formulár</h4>
                {useComplexForm && (
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                )}
              </div>
              <p className="text-slate-600 mb-4">
                Detailné údaje s možnosťou nahrať dokumenty. Urýchli schvaľovací proces.
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Všetky firemné údaje</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Finančné výkazy a dokumenty</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Kolaterály a záruky</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Okamžité spracovanie</span>
                </li>
              </ul>
              <div className="mt-4 text-sm font-semibold text-emerald-600">
                ⚡ Spracovanie: o 70% rýchlejšie
              </div>
            </button>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-3xl mx-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-4">
              <CardTitle className="text-3xl mb-2">
                {useComplexForm ? "Komplexná žiadosť o úver" : "Jednoduchá žiadosť o úver"}
              </CardTitle>
              <CardDescription className="text-base">
                {useComplexForm 
                  ? "Vyplňte všetky údaje a nahrajte dokumenty pre rýchle schválenie"
                  : "Vyplňte základné údaje a my vás budeme kontaktovať"
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Firemné údaje
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Názov firmy <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="ABC Trading s.r.o."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ico">
                        IČO {useComplexForm && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="ico"
                        value={formData.ico}
                        onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                        placeholder="12345678"
                        maxLength={8}
                        required={useComplexForm}
                      />
                    </div>
                  </div>

                  {useComplexForm && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dic">DIČ</Label>
                          <Input
                            id="dic"
                            value={formData.dic}
                            onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                            placeholder="SK2012345678"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="legalForm">
                            Právna forma <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.legalForm}
                            onValueChange={(value) => setFormData({ ...formData, legalForm: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sro">s.r.o.</SelectItem>
                              <SelectItem value="as">a.s.</SelectItem>
                              <SelectItem value="szco">SZČO</SelectItem>
                              <SelectItem value="vos">v.o.s.</SelectItem>
                              <SelectItem value="ks">k.s.</SelectItem>
                              <SelectItem value="other">Iné</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">
                          Adresa sídla <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Hlavná 123"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">
                            Mesto <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Bratislava"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">
                            PSČ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="zipCode"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            placeholder="81101"
                            maxLength={5}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="yearEstablished">
                            Rok založenia <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="yearEstablished"
                            type="number"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={formData.yearEstablished}
                            onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                            placeholder="2020"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numberOfEmployees">
                            Počet zamestnancov <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="numberOfEmployees"
                            type="number"
                            min="0"
                            value={formData.numberOfEmployees}
                            onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                            placeholder="5"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Kontaktné údaje
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">
                        Kontaktná osoba <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Ján Novák"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jan.novak@firma.sk"
                        required
                      />
                    </div>
                    <div className="col-span-full space-y-2">
                      <Label htmlFor="phone">
                        Telefón <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+421 900 123 456"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Detaily úveru
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Požadovaná suma (€) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1000"
                        step="100"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="10000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="durationMonths">
                        Doba trvania <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.durationMonths}
                        onValueChange={(value) => setFormData({ ...formData, durationMonths: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 mesiacov</SelectItem>
                          <SelectItem value="12">12 mesiacov</SelectItem>
                          <SelectItem value="18">18 mesiacov</SelectItem>
                          <SelectItem value="24">24 mesiacov</SelectItem>
                          <SelectItem value="36">36 mesiacov</SelectItem>
                          <SelectItem value="48">48 mesiacov</SelectItem>
                          <SelectItem value="60">60 mesiacov</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">
                      Účel úveru <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Napr. Nákup vybavenia, rozšírenie prevádzky, refinancovanie..."
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Financial Info - Complex Form Only */}
                {useComplexForm && (
                  <div className="space-y-4 bg-gradient-to-br from-emerald-50 to-blue-50 p-6 rounded-xl border-2 border-emerald-200">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Finančné údaje
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="annualRevenue">
                          Ročný obrat (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="annualRevenue"
                          type="number"
                          min="0"
                          step="1000"
                          value={formData.annualRevenue}
                          onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                          placeholder="100000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyRevenue">
                          Mesačné príjmy (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="monthlyRevenue"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.monthlyRevenue}
                          onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                          placeholder="8000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyExpenses">
                          Mesačné výdavky (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="monthlyExpenses"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.monthlyExpenses}
                          onChange={(e) => setFormData({ ...formData, monthlyExpenses: e.target.value })}
                          placeholder="6000"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="existingLoans">Existujúce úvery a záväzky</Label>
                      <Textarea
                        id="existingLoans"
                        value={formData.existingLoans}
                        onChange={(e) => setFormData({ ...formData, existingLoans: e.target.value })}
                        placeholder="Uveďte existujúce úvery, ich výšku a mesačné splátky..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Collateral Info - Complex Form Only */}
                {useComplexForm && (
                  <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Kolaterál / Záruka
                    </h3>
                    <p className="text-sm text-slate-600">
                      Poskytnutie kolaterálu môže výrazne urýchliť schválenie úveru a znížiť úrokovú sadzbu
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="collateralType">Typ kolaterálu</Label>
                        <Select
                          value={formData.collateralType}
                          onValueChange={(value) => setFormData({ ...formData, collateralType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte typ..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="real_estate">Nehnuteľnosť</SelectItem>
                            <SelectItem value="vehicle">Vozidlo</SelectItem>
                            <SelectItem value="equipment">Zariadenie/Stroje</SelectItem>
                            <SelectItem value="inventory">Zásoby</SelectItem>
                            <SelectItem value="receivables">Pohľadávky</SelectItem>
                            <SelectItem value="guarantee">Bankové záruka</SelectItem>
                            <SelectItem value="other">Iné</SelectItem>
                            <SelectItem value="none">Bez kolaterálu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collateralValue">Odhadovaná hodnota (€)</Label>
                        <Input
                          id="collateralValue"
                          type="number"
                          min="0"
                          step="1000"
                          value={formData.collateralValue}
                          onChange={(e) => setFormData({ ...formData, collateralValue: e.target.value })}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collateralDescription">Popis kolaterálu</Label>
                      <Textarea
                        id="collateralDescription"
                        value={formData.collateralDescription}
                        onChange={(e) => setFormData({ ...formData, collateralDescription: e.target.value })}
                        placeholder="Detailný popis kolaterálu (napr. adresa nehnuteľnosti, značka a model vozidla, typ zariadenia...)"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Odosielam žiadosť...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-5 w-5" />
                      Odoslať žiadosť
                    </>
                  )}
                </Button>

                <p className="text-sm text-slate-500 text-center">
                  Odoslaním žiadosti súhlasíte so spracovaním osobných údajov
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

