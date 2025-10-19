import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Vitajte, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </p>
        <div className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold">Nafinancuj.sk Platform</h2>
          <p className="text-sm text-muted-foreground">
            Systém je úspešne nastavený. Pokračujeme s implementáciou funkcií.
          </p>
        </div>
      </div>
    </div>
  );
}

