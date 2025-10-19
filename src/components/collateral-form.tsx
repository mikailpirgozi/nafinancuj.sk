"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";

interface CollateralFormProps {
  loanId: string;
  onSuccess: () => void;
}

interface CollateralFormData {
  type: "REAL_ESTATE" | "VEHICLE" | "OTHER";
  description: string;
  estimatedValue: string;
  // Real Estate fields
  address: string;
  cadastralArea: string;
  parcelNumber: string;
  listOfOwnership: string;
  // Vehicle fields
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
}

export function CollateralForm({ loanId, onSuccess }: CollateralFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CollateralFormData>({
    type: "REAL_ESTATE",
    description: "",
    estimatedValue: "",
    address: "",
    cadastralArea: "",
    parcelNumber: "",
    listOfOwnership: "",
    vin: "",
    licensePlate: "",
    make: "",
    model: "",
    year: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build details object based on type
      let details = {};
      if (formData.type === "REAL_ESTATE") {
        details = {
          address: formData.address || undefined,
          cadastralArea: formData.cadastralArea || undefined,
          parcelNumber: formData.parcelNumber || undefined,
          listOfOwnership: formData.listOfOwnership || undefined,
        };
      } else if (formData.type === "VEHICLE") {
        details = {
          vin: formData.vin || undefined,
          licensePlate: formData.licensePlate || undefined,
          make: formData.make || undefined,
          model: formData.model || undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
        };
      }

      const payload = {
        loanId,
        type: formData.type,
        description: formData.description,
        estimatedValue: Math.round(parseFloat(formData.estimatedValue) * 100), // Convert to cents
        details,
      };

      const response = await fetch("/api/collaterals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri pridávaní kolaterálu");
      }

      toast.success("Kolaterál úspešne pridaný!");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating collateral:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri pridávaní kolaterálu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "REAL_ESTATE",
      description: "",
      estimatedValue: "",
      address: "",
      cadastralArea: "",
      parcelNumber: "",
      listOfOwnership: "",
      vin: "",
      licensePlate: "",
      make: "",
      model: "",
      year: "",
    });
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Pridať kolaterál
        </CardTitle>
        <CardDescription>Zaznamenajte zabezpečenie pre tento úver</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Typ kolaterálu <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "REAL_ESTATE" | "VEHICLE" | "OTHER") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REAL_ESTATE">Nehnuteľnosť</SelectItem>
                    <SelectItem value="VEHICLE">Vozidlo</SelectItem>
                    <SelectItem value="OTHER">Iné</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">
                  Odhadovaná hodnota (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  placeholder="50000.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Popis <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Stručný popis kolaterálu..."
                rows={3}
                required
              />
            </div>

            {/* Real Estate Fields */}
            {formData.type === "REAL_ESTATE" && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900">Detaily nehnuteľnosti</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresa</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Hlavná 123, Bratislava"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cadastralArea">Katastrálne územie</Label>
                    <Input
                      id="cadastralArea"
                      value={formData.cadastralArea}
                      onChange={(e) => setFormData({ ...formData, cadastralArea: e.target.value })}
                      placeholder="Bratislava - Staré Mesto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parcelNumber">Číslo parcely</Label>
                    <Input
                      id="parcelNumber"
                      value={formData.parcelNumber}
                      onChange={(e) => setFormData({ ...formData, parcelNumber: e.target.value })}
                      placeholder="123/45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listOfOwnership">List vlastníctva</Label>
                    <Input
                      id="listOfOwnership"
                      value={formData.listOfOwnership}
                      onChange={(e) => setFormData({ ...formData, listOfOwnership: e.target.value })}
                      placeholder="LV 12345"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Fields */}
            {formData.type === "VEHICLE" && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-purple-900">Detaily vozidla</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Značka</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      placeholder="BMW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="X5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Rok výroby</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">EČV</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      placeholder="BA123AB"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      placeholder="WBADT43452G123456"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                Zrušiť
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Pridávam...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Pridať kolaterál
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

