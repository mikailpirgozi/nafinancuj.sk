"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [organization, setOrganization] = useState({
    name: "Nafinancuj.sk s.r.o.",
    ico: "12345678",
    dic: "SK12345678",
    email: "info@nafinancuj.sk",
    phone: "+421 2 1234 5678",
    address: "Paulínska 2",
    city: "Bratislava",
    postalCode: "811 04",
  });

  const [profile, setProfile] = useState({
    name: "Ján Admin",
    email: "jan.admin@nafinancuj.sk",
    phone: "+421 910 123 456",
    language: "sk",
    timezone: "Europe/Bratislava",
  });

  const [notifications, setNotifications] = useState({
    emailNewApplications: true,
    emailApprovedLoans: true,
    emailOverduePayments: true,
    emailReceivedPayments: true,
    smsCriticalReminders: false,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
  });

  const [apiKeys, setApiKeys] = useState({
    finstatPrivate: "E18488FD1FBD4373A5456B2D4B578140",
    finstatPublic: "BEBB0DA2A8F64958A30888D853505EC8",
    resendApiKey: "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    resendFromEmail: "noreply@nafinancuj.sk",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveOrganization = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Nastavenia organizácie uložené");
    } catch (error) {
      toast.error("Chyba pri uložení nastavení");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Profil úspešne aktualizovaný");
    } catch (error) {
      toast.error("Chyba pri aktualizácii profilu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notifikácie uložené");
    } catch (error) {
      toast.error("Chyba pri uložení notifikácií");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("API kľúče uložené");
    } catch (error) {
      toast.error("Chyba pri uložení API kľúčov");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-6 max-w-4xl">
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
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Nastavenia</h1>
              <p className="text-slate-600">Správa vašich účtov a nastavení</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organization" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200 grid w-full grid-cols-5">
            <TabsTrigger value="organization" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Organizácia
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Notifikácie
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Bezpečnosť
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              API
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Organization */}
          <TabsContent value="organization" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Nastavenia organizácie</CardTitle>
                <CardDescription>Aktualizujte základné informácie vašej organizácie</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Názov organizácie</Label>
                    <Input
                      id="org-name"
                      value={organization.name}
                      onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ico">IČO</Label>
                    <Input
                      id="ico"
                      value={organization.ico}
                      onChange={(e) => setOrganization({ ...organization, ico: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dic">DIČ</Label>
                    <Input
                      id="dic"
                      value={organization.dic}
                      onChange={(e) => setOrganization({ ...organization, dic: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={organization.email}
                      onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefón</Label>
                    <Input
                      id="phone"
                      value={organization.phone}
                      onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresa</Label>
                    <Input
                      id="address"
                      value={organization.address}
                      onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Mesto</Label>
                    <Input
                      id="city"
                      value={organization.city}
                      onChange={(e) => setOrganization({ ...organization, city: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal">PSČ</Label>
                    <Input
                      id="postal"
                      value={organization.postalCode}
                      onChange={(e) => setOrganization({ ...organization, postalCode: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveOrganization} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full">
                  {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Uložiť zmeny
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Profile */}
          <TabsContent value="profile" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Používateľský profil</CardTitle>
                <CardDescription>Aktualizujte svoj profil a nastavenia</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Meno</Label>
                  <Input
                    id="profile-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email (spravovaný Clerk)</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="border-slate-200 bg-slate-50"
                  />
                  <p className="text-sm text-slate-500">Email sa dá zmeniť v Clerk settings</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Telefón</Label>
                  <Input
                    id="profile-phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Jazyk</Label>
                    <Select value={profile.language} onValueChange={(value) => setProfile({ ...profile, language: value })}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sk">Slovenčina</SelectItem>
                        <SelectItem value="en">Angličtina</SelectItem>
                        <SelectItem value="cs">Čeština</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Časové pásmo</Label>
                    <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Bratislava">Europe/Bratislava</SelectItem>
                        <SelectItem value="Europe/Prague">Europe/Prague</SelectItem>
                        <SelectItem value="Europe/Budapest">Europe/Budapest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full">
                  {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Uložiť zmeny
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Notifications */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Nastavenia notifikácií</CardTitle>
                <CardDescription>Ovládajte, aké notifikácie chcete dostávať</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Email notifikácie</h3>
                  <div className="space-y-3">
                    {[
                      { key: "emailNewApplications", label: "Nové žiadosti o úver" },
                      { key: "emailApprovedLoans", label: "Schválené úvery" },
                      { key: "emailOverduePayments", label: "Omeškané splátky" },
                      { key: "emailReceivedPayments", label: "Prijaté platby" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <Checkbox
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                        />
                        <span className="font-medium text-slate-900">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">SMS notifikácie</h3>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={notifications.smsCriticalReminders}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, smsCriticalReminders: checked as boolean })
                      }
                    />
                    <span className="font-medium text-slate-900">Kritické upomienky</span>
                  </label>
                </div>

                <Button onClick={handleSaveNotifications} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full">
                  {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Uložiť zmeny
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Security */}
          <TabsContent value="security" className="mt-6 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Zmena hesla</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-slate-600 mb-4">Heslo sa spravuje prostredníctvom Clerk</p>
                <Button variant="outline" className="border-slate-200 hover:border-blue-300">
                  <Lock className="mr-2 h-4 w-4" />
                  Zmeniť heslo v Clerk
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Dvojfaktorová autentifikácia</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Status</p>
                    <p className="text-sm text-slate-600">Momentálne {security.twoFactorEnabled ? "zapnutá" : "vypnutá"}</p>
                  </div>
                  <Badge className={security.twoFactorEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
                    {security.twoFactorEnabled ? "Zapnutá" : "Vypnutá"}
                  </Badge>
                </div>
                <Button variant="outline" className="border-slate-200 hover:border-blue-300 w-full">
                  {security.twoFactorEnabled ? "Vypnúť 2FA" : "Zapnúť 2FA"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Aktívne relácie</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Desktop (Chrome)</p>
                    <p className="text-sm text-slate-600">Aktuálna relácia</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Aktívna</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Mobile (Safari)</p>
                    <p className="text-sm text-slate-600">Pred 2 dňami</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:text-red-700">
                    <LogOut className="h-4 w-4 mr-2" />
                    Odhlásiť
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: API Keys */}
          <TabsContent value="api" className="mt-6 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Finstat API</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800">Tieto kľúče sú citlivé - uchovávajte ich v bezpečí</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finstat-private">Private Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="finstat-private"
                      type={showPrivateKey ? "text" : "password"}
                      value={apiKeys.finstatPrivate}
                      onChange={(e) => setApiKeys({ ...apiKeys, finstatPrivate: e.target.value })}
                      className="border-slate-200 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="border-slate-200"
                    >
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finstat-public">Public Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="finstat-public"
                      type={showPublicKey ? "text" : "password"}
                      value={apiKeys.finstatPublic}
                      onChange={(e) => setApiKeys({ ...apiKeys, finstatPublic: e.target.value })}
                      className="border-slate-200 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      className="border-slate-200"
                    >
                      {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Resend API</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resend-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKeys.resendApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, resendApiKey: e.target.value })}
                      className="border-slate-200 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="border-slate-200"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resend-email">From Email</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    value={apiKeys.resendFromEmail}
                    onChange={(e) => setApiKeys({ ...apiKeys, resendFromEmail: e.target.value })}
                    className="border-slate-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveApiKeys} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full">
              {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Uložiť API kľúče
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

