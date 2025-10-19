"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { ReactNode } from "react";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      <Providers>
        {children}
      </Providers>
    </ClerkProvider>
  );
}
