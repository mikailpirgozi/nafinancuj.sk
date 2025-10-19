"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface DatePickerProps {
  value: string | Date;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({ value, onChange, placeholder = "Vyberte dátum", disabled }: DatePickerProps) {
  const date = value instanceof Date ? value : new Date(value);
  const isValid = !isNaN(date.getTime());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {isValid ? format(date, "d. MMMM yyyy", { locale: sk }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <CalendarComponent
          mode="single"
          selected={isValid ? date : undefined}
          onSelect={(d) => {
            if (d) onChange(d.toISOString().split("T")[0]);
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
