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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  companyName: string | null;
  contactPerson: string;
}

interface ApplicationFormData {
  clientId: string;
  amount: string;
  purpose: string;
  durationMonths: string;
}

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: ApplicationFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ApplicationFormData>({
    clientId: "",
    amount: "",
    purpose: "",
    durationMonths: "12",
  });

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

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
        purpose: formData.purpose,
        durationMonths: parseInt(formData.durationMonths),
      };

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní žiadosti");
      }

      toast.success("Žiadosť úspešne vytvorená!");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating application:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní žiadosti");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      amount: "",
      purpose: "",
      durationMonths: "12",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nová žiadosť o úver</DialogTitle>
          <DialogDescription>Vytvorte novú žiadosť o úver pre klienta</DialogDescription>
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

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Požadovaná suma (€) <span className="text-red-500">*</span>
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

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">
                Účel úveru <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Napr. Nákup vybavenia, rozšírenie prevádzky, refinancovanie..."
                rows={3}
                required
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="durationMonths">
                Požadovaná doba trvania <span className="text-red-500">*</span>
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-900 font-semibold mb-1">ℹ️ Informácia</p>
              <p className="text-blue-800">
                Žiadosť bude vytvorená so statusom &ldquo;Nová&rdquo; a môžete ju následne spracovať v CRM
                systéme.
              </p>
            </div>
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
                  Vytvoriť žiadosť
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

