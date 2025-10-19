"use client";

import { Providers } from "@/components/providers";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}

