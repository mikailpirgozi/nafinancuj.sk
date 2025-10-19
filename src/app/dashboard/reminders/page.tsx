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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard-header";
import { ReminderPolicyDialog } from "@/components/reminder-policy-dialog";
import {
  AlertCircle,
  Bell,
  Zap,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ReminderPolicy {
  id: string;
  daysAfterDue: number;
  reminderType: "EMAIL" | "SMS";
  feeType: "FIXED" | "PERCENTAGE";
  feeAmount: string;
  messageTemplate: string;
  createdAt: string;
}

export default function RemindersPage() {
  const [policies, setPolicies] = useState<ReminderPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<ReminderPolicy | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reminders/policies");
      const data = await response.json();
      setPolicies(data.data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Chyba pri načítaní politík");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReminders = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/reminders/generate", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chyba pri generovaní upomienok");
      }

      toast.success(
        `Odoslané upomienky: ${data.data.remindersSent}, Poplatky: €${data.data.totalFeesCharged}`
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri generovaní upomienok");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Ste si istí, že chcete zmazať túto politiku?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reminders/policies/${policyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Chyba pri mazaní politiky");
      }

      toast.success("Politika úspešne zmazaná");
      await fetchPolicies();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri mazaní politiky");
    }
  };

  const activePolicies = policies.length;
  const emailPolicies = policies.filter((p) => p.reminderType === "EMAIL").length;
  const totalFees = policies.reduce(
    (sum, p) => sum + (parseFloat(p.feeAmount) || 0),
    0
  );

  if (!Array.isArray(policies)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader currentPage="reminders" />

      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Upomienky</h2>
            <p className="text-slate-600 text-lg">Správa politík automatických upomienok</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchPolicies}
              variant="outline"
              disabled={loading}
              className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button
              onClick={handleGenerateReminders}
              disabled={isGenerating || policies.length === 0}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-500/30"
            >
              <Zap className="mr-2 h-4 w-4" />
              Spustiť upomienky
            </Button>
            <Button
              onClick={() => {
                setSelectedPolicy(undefined);
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nová politika
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Aktívne politiky</CardTitle>
              <Bell className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{activePolicies}</div>
              <p className="text-white/80 text-sm">Konfigurovaných politík</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Email politiky</CardTitle>
              <AlertCircle className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{emailPolicies}</div>
              <p className="text-white/80 text-sm">Politiky s emailami</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Celkové poplatky</CardTitle>
              <Zap className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">€{totalFees.toFixed(2)}</div>
              <p className="text-white/80 text-sm">Maximálne poplatky za uplátť</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="policies" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger
              value="policies"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              Politiky ({policies.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              História
            </TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Zoznam politík</CardTitle>
                <CardDescription>
                  Všetky nakonfigurované politiky pre automatické upomienky
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {policies.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Žiadne politiky
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Zatiaľ nie sú vytvorené žiadne politiky upomienok
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedPolicy(undefined);
                        setIsDialogOpen(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Vytvoriť prvú politiku
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60 hover:bg-transparent">
                        <TableHead>Dni</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Poplatok</TableHead>
                        <TableHead>Náhľad šablóny</TableHead>
                        <TableHead>Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((policy) => (
                        <TableRow
                          key={policy.id}
                          className="border-slate-200/60 hover:bg-slate-50/60"
                        >
                          <TableCell className="font-semibold">{policy.daysAfterDue}</TableCell>
                          <TableCell>
                            <Badge
                              variant={policy.reminderType === "EMAIL" ? "default" : "secondary"}
                              className={
                                policy.reminderType === "EMAIL"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {policy.reminderType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              {policy.feeAmount}
                              {policy.feeType === "FIXED" ? " €" : " %"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                            {policy.messageTemplate.substring(0, 50)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPolicy(policy);
                                  setIsDialogOpen(true);
                                }}
                                className="border-slate-200 hover:border-blue-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePolicy(policy.id)}
                                className="border-slate-200 hover:border-red-300 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>História upomienok</CardTitle>
                <CardDescription>
                  Prehľad všetkých odoslaných upomienok
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    História nie je dostupná
                  </h3>
                  <p className="text-slate-600">
                    Spustiť upomienky a sledovať históriu ich odoslania
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ReminderPolicyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        policy={selectedPolicy}
        onSuccess={fetchPolicies}
      />
    </div>
  );
}
