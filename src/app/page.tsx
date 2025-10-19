import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary to-secondary">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-5xl font-bold text-white">Nafinancuj.sk</h1>
        <p className="mb-8 text-xl text-white/90">
          Automatizovaná platforma pre správu podnikateľských pôžičiek
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/sign-in"
            className="rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-colors hover:bg-white/90"
          >
            Prihlásiť sa
          </a>
          <a
            href="/sign-up"
            className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
          >
            Registrovať sa
          </a>
        </div>
      </div>
    </div>
  );
}
