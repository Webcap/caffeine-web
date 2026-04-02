"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Globe, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push("/");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="logo" style={{ justifyContent: "center", fontSize: "2rem", marginBottom: "16px" }}>
            CAFFEINE <span className="logo-badge">TV</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "8px" }}>Welcome Back</h2>
          <p style={{ color: "var(--text-muted)" }}>Sign in to continue your streaming journey.</p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: "24px", 
            padding: "16px", 
            background: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid rgba(239, 68, 68, 0.2)", 
            borderRadius: "16px", 
            color: "#ef4444", 
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.4s ease"
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail 
                size={18} 
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
              />
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "48px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <a href="#" className="auth-link" style={{ fontSize: "0.8rem", fontWeight: 400 }}>Forgot Password?</a>
            </div>
            <div style={{ position: "relative" }}>
              <Lock 
                size={18} 
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
              />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "48px" }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: "100%", justifyContent: "center", padding: "16px", borderRadius: "16px", marginTop: "12px", fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ margin: "32px 0", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
        </div>

        <button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "14px", borderRadius: "16px" }}>
          <Globe size={20} />
          GitHub
        </button>

        <div className="auth-footer">
          Don't have an account? 
          <Link href="/signup" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
