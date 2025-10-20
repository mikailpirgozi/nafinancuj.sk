"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface DatePickerProps {
  value: string | Date;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({ value, onChange, placeholder = "Vyberte dátum", disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value instanceof Date ? value : new Date(value);
  const isValid = !isNaN(date.getTime());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
        >
          {isValid ? format(date, "d. MMMM yyyy", { locale: sk }) : placeholder}
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 overflow-hidden" align="start">
        <CalendarComponent
          mode="single"
          selected={isValid ? date : undefined}
          captionLayout="dropdown"
          onSelect={(d) => {
            if (d) {
              onChange(d.toISOString().split("T")[0]);
              setOpen(false);
            }
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
