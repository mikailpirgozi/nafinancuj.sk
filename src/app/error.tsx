"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Chyba!</h2>
        <p className="text-slate-600 mb-6">Niečo sa pokazilo. Skúste prosím znovu.</p>
        <button
          onClick={reset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Skúsiť znovu
        </button>
      </div>
    </div>
  );
}
