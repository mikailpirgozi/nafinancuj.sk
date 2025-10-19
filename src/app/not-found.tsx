import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-5xl font-bold text-slate-900 mb-2">404</h2>
        <p className="text-xl text-slate-600 mb-6">Stránka nebola nájdená</p>
        <Link
          href="/dashboard"
          className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Späť na dashboard
        </Link>
      </div>
    </div>
  );
}
