"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const finstatClientSchema = z.object({
  ico: z.string().regex(/^\d{8}$/, "IČO musí mať 8 číslic"),
  companyName: z.string().min(1, "Názov firmy je povinný"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  dic: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type FinstatClientFormData = z.infer<typeof finstatClientSchema>;

interface FinstatClientFormProps {
  onSubmit: (data: FinstatClientFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function FinstatClientForm({ onSubmit, isSubmitting = false }: FinstatClientFormProps) {
  const [formData, setFormData] = useState<FinstatClientFormData>({
    ico: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    dic: "",
    contactPerson: "",
    notes: "",
  });

  const [isFetching, setIsFetching] = useState(false);
  const [finstatError, setFinstatError] = useState<string | null>(null);

  const handleFetchFromFinstat = async () => {
    const icoValidation = z.string().regex(/^\d{8}$/).safeParse(formData.ico);

    if (!icoValidation.success) {
      toast.error("Zadajte správne IČO (8 číslic)");
      return;
    }

    setIsFetching(true);
    setFinstatError(null);

    try {
      const response = await fetch(`/api/finstat/${formData.ico}`);

      if (!response.ok) {
        throw new Error("Firmu sa nepodarilo načítať z Finstat");
      }

      const data = await response.json();
      const finstatData = data.data;

      // Auto-fill form with Finstat data
      setFormData((prev) => ({
        ...prev,
        companyName: finstatData.companyName || finstatData.name || prev.companyName,
        dic: finstatData.dic || prev.dic,
        address: finstatData.address || prev.address,
        city: finstatData.city || prev.city,
        postalCode: finstatData.postalCode || prev.postalCode,
        contactPerson: finstatData.contactPerson || prev.contactPerson,
      }));

      toast.success("Údaje z Finstat načítané!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Chyba pri načítavaní";
      setFinstatError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = finstatClientSchema.safeParse(formData);

    if (!validation.success) {
      toast.error("Vyplňte všetky povinné polia");
      return;
    }

    try {
      await onSubmit(validation.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri ukladaní klienta");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Finstat Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-4">Načítanie dát z Finstat</h3>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="IČO (8 číslic)"
            value={formData.ico}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 8);
              setFormData({ ...formData, ico: value });
            }}
            maxLength={8}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleFetchFromFinstat}
            disabled={isFetching || formData.ico.length !== 8}
            className="gap-2"
          >
            {isFetching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Načítavam...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Načítať
              </>
            )}
          </Button>
        </div>

        {finstatError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{finstatError}</span>
          </div>
        )}
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ico">IČO *</Label>
          <Input
            id="ico"
            type="text"
            value={formData.ico}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 8);
              setFormData({ ...formData, ico: value });
            }}
            placeholder="12345678"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dic">DIČ</Label>
          <Input
            id="dic"
            type="text"
            value={formData.dic}
            onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
            placeholder="SK..."
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Názov firmy *</Label>
        <Input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="Názov spoločnosti"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="info@firma.sk"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefón</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+421..."
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresa</Label>
        <Input
          id="address"
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Ulica a číslo"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Mesto</Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Bratislava"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">PSČ</Label>
          <Input
            id="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            placeholder="80000"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPerson">Kontaktná osoba</Label>
        <Input
          id="contactPerson"
          type="text"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          placeholder="Meno osoby"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Poznámky</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Dodatočné informácie"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {isSubmitting ? "Ukladám..." : "Vytvoriť klienta"}
      </Button>
    </form>
  );
}
