"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <h1 className="text-2xl font-bold tracking-tight">Loading DocuMind AI...</h1>
    </div>
  );
}
