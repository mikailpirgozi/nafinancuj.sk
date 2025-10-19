"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Plus, Calculator } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  companyName: string | null;
  contactPerson: string;
}

interface LoanFormData {
  clientId: string;
  amount: string;
  interestRateAnnual: string;
  productType: "AMORTIZING" | "INTEREST_ONLY";
  durationMonths: string;
  startDate: string;
}

interface LoanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LoanFormDialog({ open, onOpenChange, onSuccess }: LoanFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);

  const [formData, setFormData] = useState<LoanFormData>({
    clientId: "",
    amount: "",
    interestRateAnnual: "12.5",
    productType: "AMORTIZING",
    durationMonths: "12",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(formData.amount);
    const annualRate = parseFloat(formData.interestRateAnnual);
    const months = parseInt(formData.durationMonths);

    if (!principal || !annualRate || !months) {
      setMonthlyPayment(null);
      return;
    }

    const monthlyRate = annualRate / 100 / 12;

    if (formData.productType === "AMORTIZING") {
      // Amortizing loan formula
      const payment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);
      setMonthlyPayment(payment);
    } else {
      // Interest-only loan
      const payment = principal * monthlyRate;
      setMonthlyPayment(payment);
    }
  };

  useEffect(() => {
    // Calculate monthly payment when form data changes
    if (formData.amount && formData.interestRateAnnual && formData.durationMonths) {
      calculateMonthlyPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.amount, formData.interestRateAnnual, formData.durationMonths, formData.productType]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      setClients(data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Chyba pri načítaní klientov");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        clientId: formData.clientId,
        amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
        interestRateAnnual: formData.interestRateAnnual,
        interestRateMonthly: (parseFloat(formData.interestRateAnnual) / 12).toFixed(2),
        productType: formData.productType,
        durationMonths: parseInt(formData.durationMonths),
        startDate: formData.startDate,
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

      toast.success("Úver úspešne vytvorený!");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating loan:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní úveru");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      amount: "",
      interestRateAnnual: "12.5",
      productType: "AMORTIZING",
      durationMonths: "12",
      startDate: new Date().toISOString().split("T")[0],
    });
    setMonthlyPayment(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nový úver</DialogTitle>
          <DialogDescription>
            Vytvorte nový úver s automatickým výpočtom splátok
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Klient <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte klienta" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName || client.contactPerson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Suma úveru (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="100"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="10000"
                  required
                />
              </div>

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
                  value={formData.interestRateAnnual}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRateAnnual: e.target.value })
                  }
                  placeholder="12.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productType">
                  Typ úveru <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value: "AMORTIZING" | "INTEREST_ONLY") =>
                    setFormData({ ...formData, productType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMORTIZING">Amortizačný (splátky istiny + úrok)</SelectItem>
                    <SelectItem value="INTEREST_ONLY">Úrokový (len úrok, istina na konci)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMonths">
                  Doba trvania (mesiace) <span className="text-red-500">*</span>
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

              <div className="col-span-2 space-y-2">
                <Label htmlFor="startDate">
                  Dátum začiatku <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Calculation Preview */}
            {monthlyPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-blue-900" />
                  <h3 className="font-semibold text-blue-900">Výpočet splátky</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Mesačná splátka:</p>
                    <p className="text-2xl font-bold text-blue-900">
                      €{monthlyPayment.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Celková suma na splatenie:</p>
                    <p className="text-xl font-bold text-gray-900">
                      €
                      {(
                        monthlyPayment * parseInt(formData.durationMonths) +
                        (formData.productType === "INTEREST_ONLY"
                          ? parseFloat(formData.amount)
                          : 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Celkový úrok:</p>
                    <p className="text-lg font-semibold text-orange-600">
                      €
                      {(
                        monthlyPayment * parseInt(formData.durationMonths) -
                        parseFloat(formData.amount || "0")
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mesačná úroková sadzba:</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {(parseFloat(formData.interestRateAnnual) / 12).toFixed(2)}%
                    </p>
                  </div>
                </div>
                {formData.productType === "INTEREST_ONLY" && (
                  <p className="mt-3 text-xs text-orange-600">
                    * Pri úrokovom úvere sa istina {parseFloat(formData.amount).toLocaleString()}€
                    splatí na konci obdobia
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-900 to-blue-800"
              disabled={isSubmitting || !formData.clientId}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Vytváram...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Vytvoriť úver
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

