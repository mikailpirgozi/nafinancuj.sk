"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
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
import { Calendar, CheckCircle, Clock, XCircle, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Installment {
  id: string;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paidAt: string | null;
}

interface InstallmentScheduleProps {
  installments: Installment[];
  loanId: string;
  onPaymentAdded?: () => void;
}

const STATUS_CONFIG = {
  PAID: {
    label: "Zaplatené",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
  },
  UNPAID: {
    label: "Nezaplatené",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Clock,
    iconColor: "text-slate-600",
  },
  PARTIALLY_PAID: {
    label: "Čiastočne zaplatené",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertTriangle,
    iconColor: "text-blue-600",
  },
  OVERDUE: {
    label: "Omeškané",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    iconColor: "text-red-600",
  },
};

export function InstallmentSchedule({ installments, loanId, onPaymentAdded }: InstallmentScheduleProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "BANK_TRANSFER",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const totalPrincipal = installments.reduce((sum, inst) => sum + inst.principalAmount, 0);
  const totalInterest = installments.reduce((sum, inst) => sum + inst.interestAmount, 0);
  const totalAmount = installments.reduce((sum, inst) => sum + inst.totalAmount, 0);
  const totalPaid = installments.reduce((sum, inst) => sum + inst.paidAmount, 0);

  const handleOpenPaymentDialog = (installment: Installment) => {
    setSelectedInstallment(installment);
    const remaining = installment.totalAmount - installment.paidAmount;
    setPaymentData({
      amount: (remaining / 100).toFixed(2),
      method: "BANK_TRANSFER",
      date: new Date().toISOString().split("T")[0],
      notes: `Platba za splátku č. ${installments.indexOf(installment) + 1}`,
    });
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    setIsSubmitting(true);

    try {
      const payload = {
        loanId,
        installmentId: selectedInstallment.id,
        amount: Math.round(parseFloat(paymentData.amount) * 100),
        method: paymentData.method,
        paidAt: paymentData.date,
        notes: paymentData.notes || null,
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
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Splátkový kalendár
        </CardTitle>
        <CardDescription>
          Celkom {installments.length} splátok • Zaplatené: €{(totalPaid / 100).toLocaleString()} z €
          {(totalAmount / 100).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div>
            <p className="text-sm text-slate-600 mb-1">Celková istina</p>
            <p className="text-xl font-bold text-slate-900">€{(totalPrincipal / 100).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Celkový úrok</p>
            <p className="text-xl font-bold text-orange-600">€{(totalInterest / 100).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Celková suma</p>
            <p className="text-xl font-bold text-blue-900">€{(totalAmount / 100).toLocaleString()}</p>
          </div>
        </div>

        {/* Installments Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Splatnosť</TableHead>
                <TableHead className="text-right">Istina</TableHead>
                <TableHead className="text-right">Úrok</TableHead>
                <TableHead className="text-right">Celkom</TableHead>
                <TableHead className="text-right">Zaplatené</TableHead>
                <TableHead className="text-right">Zostáva</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((installment, index) => {
                const remaining = installment.totalAmount - installment.paidAmount;
                const progress = (installment.paidAmount / installment.totalAmount) * 100;
                const statusConfig = STATUS_CONFIG[installment.status as keyof typeof STATUS_CONFIG];
                const StatusIcon = statusConfig.icon;

                const isOverdue = installment.status === "OVERDUE";
                const isPaid = installment.status === "PAID";

                return (
                  <TableRow
                    key={installment.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isOverdue ? "bg-red-50/30" : isPaid ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {new Date(installment.dueDate).toLocaleDateString("sk-SK")}
                        </span>
                      </div>
                      {installment.paidAt && (
                        <p className="text-xs text-emerald-600 mt-1">
                          Zaplatené: {new Date(installment.paidAt).toLocaleDateString("sk-SK")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{(installment.principalAmount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-orange-600">
                      €{(installment.interestAmount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      €{(installment.totalAmount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      €{(installment.paidAmount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      €{(remaining / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress
                          value={progress}
                          className={`h-2 ${
                            isPaid
                              ? "bg-emerald-100"
                              : isOverdue
                              ? "bg-red-100"
                              : "bg-slate-100"
                          }`}
                        />
                        <p className="text-xs text-slate-600 mt-1">{progress.toFixed(0)}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.iconColor}`} />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {installment.status !== "PAID" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPaymentDialog(installment)}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Uhradiť
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {installments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Žiadne splátky</p>
          </div>
        )}
      </CardContent>

      {/* Quick Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Uhradiť splátku
            </DialogTitle>
            <DialogDescription>
              {selectedInstallment && (
                <>
                  Splátka č. {installments.indexOf(selectedInstallment) + 1} •{" "}
                  {new Date(selectedInstallment.dueDate).toLocaleDateString("sk-SK")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment}>
            <div className="grid gap-4 py-4">
              {selectedInstallment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-blue-700">Celková suma:</p>
                      <p className="font-semibold text-blue-900">
                        €{(selectedInstallment.totalAmount / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Zostáva zaplatiť:</p>
                      <p className="font-semibold text-blue-900">
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
    </Card>
  );
}

