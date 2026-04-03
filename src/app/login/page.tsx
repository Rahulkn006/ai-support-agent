"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden text-white">
      {/* Background Orbs for Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-10 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center"
      >
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-500/20">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">DocuMind AI</h1>
          <p className="text-slate-400 text-lg">Smart documentation analysis starts here.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <div className="w-full space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 mr-1" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-100 blur transition-opacity z-[-1]"></div>
          </button>

          <p className="text-center text-slate-500 text-xs px-4 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            No separate account creation is required.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
