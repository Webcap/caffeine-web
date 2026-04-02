"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, Globe, Trophy, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupClient() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            username: formData.username
          }
        }
      });

      if (authError) throw authError;

      // Supabase might require email confirmation, but we'll redirect anyway 
      // or show a message. For now, redirect to home.
      router.push("/");
    } catch (err: any) {
      console.error("Signup Error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "8px" }}>Create your account</h2>
          <p style={{ color: "var(--text-muted)" }}>Join the next generation of sports and entertainment.</p>
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

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: "relative" }}>
              <User 
                size={18} 
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
              />
              <input 
                type="text" 
                name="name"
                className="form-input" 
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                style={{ paddingLeft: "48px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: "relative" }}>
              <User 
                size={18} 
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
              />
              <input 
                type="text" 
                name="username"
                className="form-input" 
                placeholder="@username"
                value={formData.username}
                onChange={handleChange}
                style={{ paddingLeft: "48px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail 
                size={18} 
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
              />
              <input 
                type="email" 
                name="email"
                className="form-input" 
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                style={{ paddingLeft: "48px" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock 
                  size={18} 
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
                />
                <input 
                  type="password" 
                  name="password"
                  className="form-input" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingLeft: "48px" }}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm</label>
              <div style={{ position: "relative" }}>
                <Lock 
                  size={18} 
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} 
                />
                <input 
                  type="password" 
                  name="confirmPassword"
                  className="form-input" 
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ paddingLeft: "48px" }}
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: "100%", justifyContent: "center", padding: "16px", borderRadius: "16px", marginTop: "12px", fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Start your journey"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? 
          <Link href="/login" className="auth-link">Sign In</Link>
        </div>

        <div style={{ marginTop: "32px", padding: "16px", borderRadius: "16px", background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.1)", display: "flex", gap: "12px", alignItems: "center" }}>
          <Trophy size={24} style={{ color: "var(--primary)" }} />
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>COMMUNITY ACCESS</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Unlock live events and community features.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
