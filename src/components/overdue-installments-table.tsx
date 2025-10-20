"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Info, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

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

interface OverdueInstallmentsTableProps {
  installments: OverdueInstallment[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onPaymentAdded?: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Prevod",
  CASH: "Hotovosť",
  CARD: "Karta",
  OTHER: "Iné",
};

export function OverdueInstallmentsTable({
  installments,
  selectedIds,
  onSelectionChange,
  onPaymentAdded,
}: OverdueInstallmentsTableProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<OverdueInstallment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "BANK_TRANSFER",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleOpenPaymentDialog = (installment: OverdueInstallment) => {
    setSelectedInstallment(installment);
    const remaining = installment.totalAmount - installment.paidAmount;
    setPaymentData({
      amount: (remaining / 100).toFixed(2),
      method: "BANK_TRANSFER",
      date: new Date().toISOString().split("T")[0],
      notes: `Platba za omeškajúcu splátku - VS: ${installment.loan.variableSymbol}`,
    });
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    setIsSubmitting(true);

    try {
      const payload = {
        loanId: selectedInstallment.loan.id,
        installmentId: selectedInstallment.id,
        amount: Math.round(parseFloat(paymentData.amount) * 100),
        paymentMethod: paymentData.method,
        paidAt: paymentData.date,
        notes: paymentData.notes || undefined,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní platby");
      }

      toast.success("Platba úspešne pridaná!");
      setIsPaymentDialogOpen(false);
      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní platby");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200/60 hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.size === installments.length && installments.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectionChange(new Set(installments.map((i) => i.id)));
                  } else {
                    onSelectionChange(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead>Klient</TableHead>
            <TableHead>VS</TableHead>
            <TableHead>Splatnosť</TableHead>
            <TableHead>Dní</TableHead>
            <TableHead className="text-right">Suma</TableHead>
            <TableHead className="text-right">Zaplatené</TableHead>
            <TableHead className="min-w-[150px]">Platby</TableHead>
            <TableHead className="min-w-[150px]">Upomienky</TableHead>
            <TableHead className="text-center">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst) => {
            const remaining = inst.totalAmount - inst.paidAmount;
            const clientName = inst.client.companyName || inst.client.contactPerson;

            return (
              <TableRow key={inst.id} className="border-slate-200/60 hover:bg-slate-50/60">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(inst.id)}
                    onCheckedChange={(checked) => {
                      const newIds = new Set(selectedIds);
                      if (checked) {
                        newIds.add(inst.id);
                      } else {
                        newIds.delete(inst.id);
                      }
                      onSelectionChange(newIds);
                    }}
                  />
                </TableCell>

                <TableCell className="font-medium">
                  <Link href={`/dashboard/clients/${inst.client.id}`} className="text-blue-600 hover:underline">
                    {clientName}
                  </Link>
                  {inst.client.phone && (
                    <div className="text-xs text-slate-500 mt-1">{inst.client.phone}</div>
                  )}
                </TableCell>

                <TableCell className="font-mono font-semibold">
                  <Link href={`/dashboard/loans/${inst.loan.id}`} className="text-blue-600 hover:underline">
                    {inst.loan.variableSymbol}
                  </Link>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-900">
                      {format(new Date(inst.dueDate), "dd.MM.yyyy", { locale: sk })}
                    </span>
                  </div>
                  {inst.paidAt && (
                    <div className="text-xs text-emerald-600 font-medium ml-6">
                      ✓ {format(new Date(inst.paidAt), "dd.MM.yyyy", { locale: sk })}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    className={
                      inst.daysOverdue > 30
                        ? "bg-red-100 text-red-800"
                        : inst.daysOverdue > 15
                        ? "bg-orange-100 text-orange-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {inst.daysOverdue} dní
                  </Badge>
                </TableCell>

                <TableCell className="text-right font-bold">
                  €{(inst.totalAmount / 100).toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <div className="font-semibold text-emerald-600">
                    €{(inst.paidAmount / 100).toLocaleString()}
                  </div>
                  {remaining > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      Zostáva: €{(remaining / 100).toLocaleString()}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {inst.payments && inst.payments.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm cursor-pointer">
                          <Info className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-blue-700">
                            {inst.payments.length}× platba
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="space-y-2">
                          {inst.payments.map((payment) => (
                            <div key={payment.id} className="text-xs border-b pb-2 last:border-0">
                              <div className="flex justify-between font-semibold">
                                <span>€{(payment.amount / 100).toLocaleString()}</span>
                                <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
                              </div>
                              <div className="text-slate-500 mt-1">
                                {format(new Date(payment.paidAt), "dd.MM.yyyy", { locale: sk })}
                              </div>
                              {payment.notes && (
                                <div className="text-slate-600 italic mt-1">{payment.notes}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {inst.reminders && inst.reminders.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm cursor-pointer">
                          <Bell className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-orange-700">
                            {inst.reminders.length}× upomienka
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <span className="text-xs font-semibold text-slate-700">Celkové poplatky:</span>
                            <span className="text-sm font-bold text-orange-600">
                              €{(inst.reminders.reduce((sum, r) => sum + r.feeCharged, 0) / 100).toLocaleString()}
                            </span>
                          </div>
                          {inst.reminders.map((reminder) => (
                            <div key={reminder.id} className="text-xs border-b pb-2 last:border-0">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-1">
                                  <Bell className="h-3 w-3 text-orange-500" />
                                  <span className="font-semibold text-slate-900">
                                    {reminder.policy.daysAfterDue} dní po splatnosti
                                  </span>
                                </div>
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  {reminder.policy.reminderType}
                                </Badge>
                              </div>
                              <div className="text-slate-600 mt-1">
                                Odoslané: {format(new Date(reminder.sentAt), "dd.MM.yyyy HH:mm", { locale: sk })}
                              </div>
                              <div className="flex justify-between items-center mt-2 bg-orange-50 p-1.5 rounded">
                                <span className="text-slate-600">Poplatok:</span>
                                <span className="font-bold text-orange-700">
                                  €{(reminder.feeCharged / 100).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Link href={`/dashboard/loans/${inst.loan.id}`}>
                      <Button size="sm" variant="outline" className="border-slate-200 hover:border-blue-300">
                        Detail
                      </Button>
                    </Link>
                    {remaining > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPaymentDialog(inst)}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Uhradiť
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
              Uhradiť omeškajúcu splátku
            </DialogTitle>
            <DialogDescription>
              {selectedInstallment && (
                <>
                  VS: {selectedInstallment.loan.variableSymbol} • Omeškanie: {selectedInstallment.daysOverdue} dní
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment}>
            <div className="grid gap-4 py-4">
              {selectedInstallment && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-red-700 font-medium">Celková suma:</p>
                      <p className="text-xl font-bold text-red-900">
                        €{(selectedInstallment.totalAmount / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium">Zostáva zaplatiť:</p>
                      <p className="text-xl font-bold text-red-900">
                        €{((selectedInstallment.totalAmount - selectedInstallment.paidAmount) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Suma (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  className="text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">
                  Spôsob úhrady <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={paymentData.method}
                  onValueChange={(value) => setPaymentData({ ...paymentData, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bankový prevod</SelectItem>
                    <SelectItem value="CASH">Hotovosť</SelectItem>
                    <SelectItem value="CARD">Karta</SelectItem>
                    <SelectItem value="OTHER">Iné</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  Dátum úhrady <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Poznámka</Label>
                <Textarea
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Voliteľná poznámka k platbe..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušiť
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ukladám..." : "Pridať platbu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

