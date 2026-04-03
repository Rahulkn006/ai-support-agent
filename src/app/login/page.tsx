"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Zap, Shield, Loader2, MessageSquare, Upload } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F14' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D4AF37' }} />
      </div>
    );
  }

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
    <div
      className="min-h-screen flex flex-col overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #0B0F14 0%, #0e1219 40%, #0B0F14 100%)',
        color: '#E5E7EB',
      }}
    >
      {/* Subtle ambient glow behind hero */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse at center, #D4AF37 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div
        className="w-full backdrop-blur-xl z-10 relative"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <LayoutDashboard size={18} style={{ color: '#D4AF37' }} />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#E5E7EB' }}>
            DocuMind
          </h1>
          <span
            className="ml-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em]"
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.15)',
            }}
          >
            AI
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-[1]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-2xl"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] mb-6"
            style={{
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.12)',
              color: '#D4AF37',
            }}
          >
            <Zap size={11} /> AI-Powered Document Intelligence
          </div>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-[1.15]"
            style={{ color: '#E5E7EB' }}
          >
            Chat with your{" "}
            <span
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F0D878 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Documents
            </span>
          </h2>
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
            Upload PDFs and text files, then ask questions. Get precise, context-aware answers grounded in your own knowledge base.
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-sm"
        >
          <div
            className="p-8 rounded-3xl"
            style={{
              background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(17, 24, 39, 0.7) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: '0 0 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(212, 175, 55, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {error && (
              <div
                className="mb-5 p-3 rounded-xl text-xs text-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group w-full py-3.5 px-5 rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: '#0B0F14',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E5E7EB',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" style={{ color: '#D4AF37' }} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="mt-5 text-center text-[11px] leading-relaxed" style={{ color: 'rgba(156, 163, 175, 0.55)' }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              No separate account creation is required.
            </p>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-4xl mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 px-4"
        >
          {[
            {
              icon: Upload,
              title: "Upload & Index",
              desc: "Drag & drop PDFs and text files. Documents are automatically chunked and vectorized for intelligent retrieval.",
            },
            {
              icon: MessageSquare,
              title: "Context-Aware Chat",
              desc: "Ask questions and receive AI answers grounded strictly in your uploaded documents with multi-turn memory.",
            },
            {
              icon: Shield,
              title: "Private Workspaces",
              desc: "Organize documents into isolated workspaces. Each workspace has its own knowledge base and chat history.",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="group p-5 rounded-2xl transition-all duration-300 cursor-default"
              style={{
                background: 'rgba(17, 24, 39, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.03)';
                e.currentTarget.style.background = 'rgba(17, 24, 39, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(17, 24, 39, 0.5)';
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-shadow duration-300"
                style={{
                  background: '#0B0F14',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#D4AF37',
                }}
              >
                <card.icon size={18} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5 tracking-tight" style={{ color: '#E5E7EB' }}>
                {card.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                {card.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="py-5 px-6 text-center relative z-[1]" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <p className="text-[11px] tracking-wide" style={{ color: 'rgba(156, 163, 175, 0.35)' }}>
          DocuMind AI &copy; {new Date().getFullYear()} &middot; Powered by Groq &middot; Built with Next.js
        </p>
      </div>
    </div>
  );
}
