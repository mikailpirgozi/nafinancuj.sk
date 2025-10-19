"use client";

import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, CheckCircle } from "lucide-react";

interface Reminder {
  id: string;
  sentAt: string;
  type: string;
  amount?: number;
  status: "SENT" | "VIEWED" | "PAID";
}

interface InstallmentRemindersProps {
  reminders?: Reminder[];
}

export function InstallmentReminders({ reminders = [] }: InstallmentRemindersProps) {
  if (reminders.length === 0) {
    return null;
  }

  const totalAmount = reminders.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-slate-700">
          Upomienky: {reminders.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-50 p-2 rounded border border-blue-100">
          <p className="text-blue-700 font-medium">Poslané</p>
          <p className="text-blue-900 font-bold">{reminders.length}</p>
        </div>
        {totalAmount > 0 && (
          <div className="bg-orange-50 p-2 rounded border border-orange-100">
            <p className="text-orange-700 font-medium">Poplatky</p>
            <p className="text-orange-900 font-bold">€{(totalAmount / 100).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
            <div className="flex items-center gap-1">
              {reminder.status === "PAID" ? (
                <CheckCircle className="h-3 w-3 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-orange-600" />
              )}
              <span className="text-slate-600">{new Date(reminder.sentAt).toLocaleDateString("sk-SK")}</span>
            </div>
            <Badge className={`text-xs ${
              reminder.status === "PAID" 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-orange-100 text-orange-800"
            }`}>
              {reminder.status === "PAID" ? "Uhradené" : "Nevyriešené"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
