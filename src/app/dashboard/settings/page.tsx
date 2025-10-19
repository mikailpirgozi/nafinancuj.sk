"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser, useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  FileText,
  User,
  Building2,
  Bell,
  Shield,
  Mail,
  Phone,
  Save,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewApplication: true,
    emailApplicationStatusChange: true,
    emailPaymentReceived: true,
    emailOverdueInstallment: true,
    smsOverdueInstallment: false,
    smsPaymentReceived: false,
  });

  // Organization settings
  const [orgSettings, setOrgSettings] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        phone: user.primaryPhoneNumber?.phoneNumber || "",
      });
    }
    if (organization) {
      setOrgSettings({
        companyName: organization.name || "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [user, organization]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // In real app, this would call Clerk API to update user
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Profil úspešne uložený");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Chyba pri ukladaní profilu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // Save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Nastavenia notifikácií uložené");
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast.error("Chyba pri ukladaní nastavení");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    setIsSaving(true);
    try {
      // Save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Nastavenia organizácie uložené");
    } catch (error) {
      console.error("Error saving organization:", error);
      toast.error("Chyba pri ukladaní nastavení");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return null;
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
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-900 transition">
                Dashboard
              </Link>
              <Link href="/dashboard/clients" className="text-gray-600 hover:text-blue-900 transition">
                <Users className="inline h-4 w-4 mr-1" />
                Klienti
              </Link>
              <Link href="/dashboard/loans" className="text-gray-600 hover:text-blue-900 transition">
                <FileBarChart className="inline h-4 w-4 mr-1" />
                Úvery
              </Link>
              <Link href="/dashboard/applications" className="text-gray-600 hover:text-blue-900 transition">
                <FileText className="inline h-4 w-4 mr-1" />
                Žiadosti
              </Link>
              <Link href="/dashboard/reminders" className="text-gray-600 hover:text-blue-900 transition">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Upomienky
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Nastavenia
          </h2>
          <p className="text-gray-600 mt-2">Spravujte svoj profil, organizáciu a notifikácie</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="organization" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Building2 className="h-4 w-4 mr-2" />
              Organizácia
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Bell className="h-4 w-4 mr-2" />
              Notifikácie
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Bezpečnosť
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Osobné údaje</CardTitle>
                <CardDescription>Upravte svoje osobné informácie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Meno</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Priezvisko</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="pl-10"
                      disabled
                    />
                  </div>
                  <p className="text-sm text-slate-500">Email sa spravuje cez Clerk</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefón</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+421 900 123 456"
                    />
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSaving ? (
                    <>Ukladám...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložiť zmeny
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Nastavenia organizácie</CardTitle>
                <CardDescription>Spravujte údaje vašej organizácie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Názov spoločnosti</Label>
                  <Input
                    id="companyName"
                    value={orgSettings.companyName}
                    onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Firemný email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgSettings.email}
                      onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                      placeholder="info@firma.sk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Firemný telefón</Label>
                    <Input
                      id="orgPhone"
                      type="tel"
                      value={orgSettings.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                      placeholder="+421 2 1234 5678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresa</Label>
                  <Input
                    id="address"
                    value={orgSettings.address}
                    onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                    placeholder="Hlavná 123, 811 01 Bratislava"
                  />
                </div>

                <Separator />

                <Button
                  onClick={handleSaveOrganization}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSaving ? (
                    <>Ukladám...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložiť zmeny
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Nastavenia notifikácií</CardTitle>
                <CardDescription>Vyberte, aké notifikácie chcete dostávať</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Emailové notifikácie
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Nová žiadosť</p>
                        <p className="text-sm text-slate-600">Notifikácia pri novej žiadosti o úver</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNewApplication}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, emailNewApplication: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Zmena statusu žiadosti</p>
                        <p className="text-sm text-slate-600">Notifikácia pri zmene statusu žiadosti</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailApplicationStatusChange}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, emailApplicationStatusChange: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Platba prijatá</p>
                        <p className="text-sm text-slate-600">Notifikácia pri prijatí platby</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailPaymentReceived}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, emailPaymentReceived: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Omeškané splátky</p>
                        <p className="text-sm text-slate-600">Notifikácia pri omeškanej splátke</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailOverdueInstallment}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, emailOverdueInstallment: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    SMS notifikácie
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Omeškané splátky</p>
                        <p className="text-sm text-slate-600">SMS pri omeškanej splátke</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsOverdueInstallment}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, smsOverdueInstallment: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Platba prijatá</p>
                        <p className="text-sm text-slate-600">SMS pri prijatí platby</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsPaymentReceived}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, smsPaymentReceived: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSaving ? (
                    <>Ukladám...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložiť zmeny
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Bezpečnosť</CardTitle>
                <CardDescription>Spravujte bezpečnostné nastavenia vášho účtu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Autentifikácia cez Clerk</h4>
                      <p className="text-sm text-blue-800">
                        Vaše heslo a bezpečnostné nastavenia sa spravujú cez Clerk. Kliknite na váš profil v pravom
                        hornom rohu pre prístup k nastaveniam.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Dvojfaktorová autentifikácia</p>
                      <p className="text-sm text-slate-600">Spravované cez Clerk</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Zmena hesla</p>
                      <p className="text-sm text-slate-600">Spravované cez Clerk</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">História prihlásení</p>
                      <p className="text-sm text-slate-600">Dostupné v Clerk dashboarde</p>
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

