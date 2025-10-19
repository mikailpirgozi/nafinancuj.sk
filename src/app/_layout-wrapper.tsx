"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { ReactNode } from "react";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <Providers>
        {children}
      </Providers>
    </ClerkProvider>
  );
}
