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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, CheckCircle, Clock, XCircle, AlertTriangle, DollarSign, Info } from "lucide-react";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
}

interface Installment {
  id: string;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paidAt: string | null;
  payments?: Payment[];
}

interface InstallmentScheduleProps {
  installments: Installment[];
  loanId: string;
  onPaymentAdded?: () => void;
}

const STATUS_CONFIG = {
  PAID: {
    label: "Zaplatené",
    color: "bg-emerald-500 text-white",
    icon: CheckCircle,
  },
  UNPAID: {
    label: "Nezaplatené",
    color: "bg-slate-300 text-slate-700",
    icon: Clock,
  },
  PARTIALLY_PAID: {
    label: "Čiastočne",
    color: "bg-blue-500 text-white",
    icon: AlertTriangle,
  },
  OVERDUE: {
    label: "Omeškané",
    color: "bg-red-500 text-white",
    icon: XCircle,
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Prevod",
  CASH: "Hotovosť",
  CARD: "Karta",
  OTHER: "Iné",
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
  const progressPercent = (totalPaid / totalAmount) * 100;

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

  const calculateDaysLate = (dueDate: string, paidDate: string | null) => {
    if (!paidDate) return 0;
    const due = new Date(dueDate);
    const paid = new Date(paidDate);
    const days = Math.floor((paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="h-6 w-6 text-blue-600" />
                Splátkový kalendár
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {installments.length} splátok • Zaplatené €{(totalPaid / 100).toLocaleString()} z €
                {(totalAmount / 100).toLocaleString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{progressPercent.toFixed(1)}%</div>
              <div className="text-sm text-slate-600">Splnené</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <p className="text-sm text-slate-600 mb-1">Istina</p>
              <p className="text-2xl font-bold text-slate-900">€{(totalPrincipal / 100).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <p className="text-sm text-slate-600 mb-1">Úrok</p>
              <p className="text-2xl font-bold text-orange-600">€{(totalInterest / 100).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <p className="text-sm text-slate-600 mb-1">Zostáva</p>
              <p className="text-2xl font-bold text-blue-900">€{((totalAmount - totalPaid) / 100).toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="min-w-[140px]">Splatnosť</TableHead>
                  <TableHead className="text-right">Istina</TableHead>
                  <TableHead className="text-right">Úrok</TableHead>
                  <TableHead className="text-right font-semibold">Celkom</TableHead>
                  <TableHead className="text-right">Zaplatené</TableHead>
                  <TableHead className="text-right">Zostáva</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[200px]">Platby</TableHead>
                  <TableHead className="text-center">Akcia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment, index) => {
                  const remaining = installment.totalAmount - installment.paidAmount;
                  const progress = (installment.paidAmount / installment.totalAmount) * 100;
                  const statusConfig = STATUS_CONFIG[installment.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig.icon;
                  const daysLate = calculateDaysLate(installment.dueDate, installment.paidAt);

                  return (
                    <TableRow
                      key={installment.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <TableCell className="text-center font-bold text-slate-700">{index + 1}</TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-900">
                            {new Date(installment.dueDate).toLocaleDateString("sk-SK")}
                          </span>
                        </div>
                        {installment.paidAt && (
                          <div className="text-xs text-emerald-600 font-medium ml-6">
                            ✓ {new Date(installment.paidAt).toLocaleDateString("sk-SK")}
                            {daysLate > 0 && (
                              <span className="text-red-600 ml-2">
                                (+{daysLate}d)
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-medium text-slate-700">
                        €{(installment.principalAmount / 100).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right font-medium text-orange-600">
                        €{(installment.interestAmount / 100).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right font-bold text-slate-900">
                        €{(installment.totalAmount / 100).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="font-semibold text-emerald-600">
                          €{(installment.paidAmount / 100).toLocaleString()}
                        </div>
                        <Progress value={progress} className="h-1.5 mt-1" />
                      </TableCell>

                      <TableCell className="text-right font-semibold text-slate-900">
                        €{(remaining / 100).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {installment.payments && installment.payments.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-sm">
                                <Info className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-blue-700">
                                  {installment.payments.length}× platba
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-2">
                                {installment.payments.map((payment) => (
                                  <div key={payment.id} className="text-xs border-b pb-2 last:border-0">
                                    <div className="flex justify-between font-semibold">
                                      <span>€{(payment.amount / 100).toLocaleString()}</span>
                                      <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
                                    </div>
                                    <div className="text-slate-500 mt-1">
                                      {new Date(payment.paidAt).toLocaleDateString("sk-SK")}
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
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Žiadne splátky</p>
            </div>
          )}
        </CardContent>

        {/* Quick Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="h-6 w-6 text-emerald-600" />
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-700 font-medium">Celková suma:</p>
                        <p className="text-xl font-bold text-blue-900">
                          €{(selectedInstallment.totalAmount / 100).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium">Zostáva zaplatiť:</p>
                        <p className="text-xl font-bold text-blue-900">
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {paymentData.date ? new Date(paymentData.date).toLocaleDateString("sk-SK") : "Vyberte dátum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(paymentData.date)}
                        onSelect={(date) => {
                          if (date) {
                            const isoDate = date.toISOString().split('T')[0];
                            setPaymentData({ ...paymentData, date: isoDate });
                            (document.querySelector('[role="button"][class*="justify-start"]') as HTMLElement)?.click();
                          }
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
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
    </TooltipProvider>
  );
}

