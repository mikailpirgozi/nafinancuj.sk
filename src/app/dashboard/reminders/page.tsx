"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Send, AlertCircle } from "lucide-react";

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
  const [editingPolicy, setEditingPolicy] = useState<ReminderPolicy | null>(null);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    daysAfterDue: "7",
    reminderType: "EMAIL" as "EMAIL" | "SMS",
    feeType: "FIXED" as "FIXED" | "PERCENTAGE",
    feeAmount: "10.00",
    messageTemplate: "",
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/reminders/policies");
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPolicy
        ? `/api/reminders/policies/${editingPolicy.id}`
        : "/api/reminders/policies";

      const method = editingPolicy ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysAfterDue: parseInt(formData.daysAfterDue),
          reminderType: formData.reminderType,
          feeType: formData.feeType,
          feeAmount: formData.feeAmount,
          messageTemplate: formData.messageTemplate,
        }),
      });

      if (res.ok) {
        await fetchPolicies();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving policy:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Naozaj chcete odstrániť túto politiku upomienok?")) return;

    try {
      const res = await fetch(`/api/reminders/policies/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchPolicies();
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
    }
  };

  const handleEdit = (policy: ReminderPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      daysAfterDue: policy.daysAfterDue.toString(),
      reminderType: policy.reminderType,
      feeType: policy.feeType,
      feeAmount: policy.feeAmount,
      messageTemplate: policy.messageTemplate,
    });
    setIsDialogOpen(true);
  };

  const handleGenerateReminders = async () => {
    if (!confirm("Spustiť generovanie upomienok pre všetky omeškané splátky?")) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/reminders/generate", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        alert(
          `Úspešne vygenerované!\n\nUpomienky: ${data.remindersGenerated}\nPoplatky: €${data.totalFeesCharged}\nSpracované splátky: ${data.overdueInstallmentsProcessed}`
        );
      }
    } catch (error) {
      console.error("Error generating reminders:", error);
      alert("Chyba pri generovaní upomienok");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setFormData({
      daysAfterDue: "7",
      reminderType: "EMAIL",
      feeType: "FIXED",
      feeAmount: "10.00",
      messageTemplate: "",
    });
  };

  const defaultTemplates = {
    EMAIL: `Dobrý deň {{client_name}},

upozorňujeme Vás, že splátka úveru vo výške {{installment_amount}}€ so splatnosťou {{due_date}} (VS: {{variable_symbol}}) nebola uhradená.

Poplatok za upomienku: {{fee_amount}}€

Prosíme o uhradenie v čo najkratšom čase.

S pozdravom,
Váš tím`,
    SMS: "Upomienka: Splatka {{installment_amount}}€ (VS: {{variable_symbol}}) po splatnosti. Poplatok: {{fee_amount}}€. Prosim uhradte.",
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-orange-600 bg-clip-text text-transparent">
            Politiky Upomienok
          </h1>
          <p className="text-gray-600 mt-2">
            Nastavte automatické upomienky a poplatky za omeškané splátky
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateReminders}
            disabled={generating}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <Send className="mr-2 h-4 w-4" />
            {generating ? "Generujem..." : "Spustiť upomienky"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nová politika
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingPolicy ? "Upraviť politiku" : "Nová politika upomienok"}
                </DialogTitle>
                <DialogDescription>
                  Nastavte pravidlá pre automatické odosielanie upomienok a účtovanie poplatkov
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="daysAfterDue">Dni po splatnosti</Label>
                      <Input
                        id="daysAfterDue"
                        type="number"
                        min="0"
                        max="365"
                        value={formData.daysAfterDue}
                        onChange={(e) =>
                          setFormData({ ...formData, daysAfterDue: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Koľko dní po splatnosti sa má upomienka odoslať
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminderType">Typ upomienky</Label>
                      <Select
                        value={formData.reminderType}
                        onValueChange={(value: "EMAIL" | "SMS") =>
                          setFormData({ ...formData, reminderType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="SMS">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feeType">Typ poplatku</Label>
                      <Select
                        value={formData.feeType}
                        onValueChange={(value: "FIXED" | "PERCENTAGE") =>
                          setFormData({ ...formData, feeType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixná suma (€)</SelectItem>
                          <SelectItem value="PERCENTAGE">Percento (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feeAmount">
                        Výška poplatku {formData.feeType === "FIXED" ? "(€)" : "(%)"}
                      </Label>
                      <Input
                        id="feeAmount"
                        type="text"
                        pattern="^\d+(\.\d{1,2})?$"
                        value={formData.feeAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, feeAmount: e.target.value })
                        }
                        placeholder="10.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messageTemplate">Šablóna správy</Label>
                    <Textarea
                      id="messageTemplate"
                      value={formData.messageTemplate}
                      onChange={(e) =>
                        setFormData({ ...formData, messageTemplate: e.target.value })
                      }
                      placeholder={defaultTemplates[formData.reminderType]}
                      rows={8}
                      required
                      className="font-mono text-sm"
                    />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-900 mb-2">
                        Dostupné premenné:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                        <code>{"{{client_name}}"}</code>
                        <code>{"{{loan_amount}}"}</code>
                        <code>{"{{installment_amount}}"}</code>
                        <code>{"{{due_date}}"}</code>
                        <code>{"{{fee_amount}}"}</code>
                        <code>{"{{variable_symbol}}"}</code>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Zrušiť
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-900 to-blue-800"
                  >
                    {editingPolicy ? "Uložiť zmeny" : "Vytvoriť politiku"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-blue-900">
        <CardHeader>
          <CardTitle>Aktívne politiky</CardTitle>
          <CardDescription>
            Zoznam všetkých nastavených politík pre automatické upomienky
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Načítavam...</div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Žiadne politiky
              </h3>
              <p className="text-gray-500 mb-4">
                Zatiaľ nemáte vytvorené žiadne politiky upomienok
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="border-blue-900 text-blue-900"
              >
                <Plus className="mr-2 h-4 w-4" />
                Vytvoriť prvú politiku
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dni po splatnosti</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Poplatok</TableHead>
                  <TableHead>Šablóna správy</TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-300"
                      >
                        {policy.daysAfterDue} dní
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={policy.reminderType === "EMAIL" ? "default" : "secondary"}
                      >
                        {policy.reminderType === "EMAIL" ? "📧 Email" : "📱 SMS"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {policy.feeType === "FIXED"
                          ? `€${policy.feeAmount}`
                          : `${policy.feeAmount}%`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-gray-600">
                        {policy.messageTemplate}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(policy)}
                          className="hover:bg-blue-50 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                          className="hover:bg-red-50 hover:text-red-600"
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

      <Card className="mt-6 border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Ako fungujú upomienky?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>1. Automatické spúšťanie:</strong> Každý deň o 6:00 ráno systém automaticky
            kontroluje omeškané splátky a odošle upomienky podľa nastavených politík.
          </p>
          <p>
            <strong>2. Poplatky:</strong> Ak je nastavený poplatok, automaticky sa pripočíta k
            celkovej sume splátky.
          </p>
          <p>
            <strong>3. Manuálne spustenie:</strong> Môžete kedykoľvek spustiť generovanie
            upomienok manuálne tlačidlom &ldquo;Spustiť upomienky&rdquo;.
          </p>
          <p>
            <strong>4. Viacero politík:</strong> Môžete vytvoriť viacero politík (napr. 7 dní =
            email, 14 dní = SMS, 30 dní = email s vyšším poplatkom).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

