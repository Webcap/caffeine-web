"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings as SettingsIcon,
  LogOut,
  Globe,
  Languages,
  Volume2,
  Type,
  ChevronRight,
  X,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

const SettingsClient = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"account" | "general">("account");
  const [watchCountry, setWatchCountry] = useState("United States");
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  const countries = [
    { name: "United States", code: "us" },
    { name: "United Kingdom", code: "gb" },
    { name: "Canada", code: "ca" },
    { name: "Australia", code: "au" },
    { name: "Germany", code: "de" },
    { name: "France", code: "fr" },
    { name: "Spain", code: "es" },
    { name: "Japan", code: "jp" },
    { name: "South Korea", code: "kr" },
    { name: "Brazil", code: "br" }
  ];

  const getFlagUrl = (code: string) => `https://raw.githubusercontent.com/hampusborgos/country-flags/main/svg/${code.toLowerCase()}.svg`;
  
  const currentCountryObj = countries.find(c => c.name === watchCountry) || countries[0];
  const currentFlagUrl = getFlagUrl(currentCountryObj.code);

  useEffect(() => {
    const savedCountry = localStorage.getItem("watchCountry");
    if (savedCountry) setWatchCountry(savedCountry);
  }, []);

  const handleSelectCountry = (countryName: string) => {
    setWatchCountry(countryName);
    localStorage.setItem("watchCountry", countryName);
    setIsCountryModalOpen(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        .settings-nav-button {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .settings-nav-button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
          transform: translateX(4px);
        }
        .settings-nav-button.active {
          background: rgba(220, 38, 38, 0.15) !important;
          border-color: var(--primary) !important;
          color: white !important;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.1);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }
        .country-item {
          padding: 16px 24px;
          border-radius: 16px;
          transition: all 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid transparent;
        }
        .country-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .country-item.active {
          background: rgba(220, 38, 38, 0.1);
          border-color: var(--primary);
        }
      `}</style>
      <Sidebar />
      
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" style={{ opacity: 0.1 }} />
        <div className="aurora aurora-2" style={{ background: "radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)", opacity: 0.1 }} />
      </div>

      <main className="main-content" style={{ padding: "80px 60px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          <header style={{ marginBottom: "64px" }} className="animate-fade-in">
            <h1 className="text-6xl font-black gradient-text">Settings</h1>
            <p className="text-lg text-muted" style={{ marginTop: "12px" }}>
              Tailor your cinematic experience to your preferences.
            </p>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "48px" }}>
            
            {/* Sidebar-style Navigation */}
            <aside className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px", animationDelay: "0.1s" }}>
              <button 
                onClick={() => setActiveTab("account")}
                className={`glass-card settings-nav-button ${activeTab === "account" ? "active" : ""}`} 
                style={{ 
                  padding: "20px 24px", 
                  textAlign: "left", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "16px",
                  background: activeTab === "account" ? "rgba(220, 38, 38, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  borderColor: activeTab === "account" ? "var(--primary)" : "rgba(255, 255, 255, 0.1)",
                  color: activeTab === "account" ? "white" : "var(--text-muted)"
                }}
              >
                <User size={20} style={{ color: activeTab === "account" ? "var(--primary)" : "inherit" }} />
                <span style={{ fontWeight: 800, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("general")}
                className={`glass-card settings-nav-button ${activeTab === "general" ? "active" : ""}`} 
                style={{ 
                  padding: "20px 24px", 
                  textAlign: "left", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "16px",
                  background: activeTab === "general" ? "rgba(220, 38, 38, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  borderColor: activeTab === "general" ? "var(--primary)" : "rgba(255, 255, 255, 0.1)",
                  color: activeTab === "general" ? "white" : "var(--text-muted)"
                }}
              >
                <SettingsIcon size={20} style={{ color: activeTab === "general" ? "var(--primary)" : "inherit" }} />
                <span style={{ fontWeight: 800, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>General</span>
              </button>
            </aside>

            {/* Main Settings Panel */}
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "32px", animationDelay: "0.2s" }}>
              
              {activeTab === "account" ? (
                <>
                  {/* Profile Section */}
                  <section className="glass-card" style={{ padding: "40px" }}>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <User size={24} style={{ color: "var(--primary)" }} />
                      Profile Details
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</span>
                        <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{user?.email}</span>
                      </div>
                      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>User ID</span>
                        <span style={{ fontFamily: "monospace", opacity: 0.6, fontSize: "0.9rem" }}>{user?.id}</span>
                      </div>
                    </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="glass-card" style={{ padding: "40px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "32px", color: "var(--loss-red)", display: "flex", alignItems: "center", gap: "16px" }}>
                      <LogOut size={24} />
                      Account Security
                    </h3>

                    <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
                      Signing out will clear your local session but keep your "Continue Watching" history synced to your account.
                    </p>

                    <button 
                      onClick={handleLogout}
                      className="btn-primary" 
                      style={{ 
                        backgroundColor: "rgba(239, 68, 68, 0.1)", 
                        color: "var(--loss-red)", 
                        borderColor: "var(--loss-red)",
                        width: "100%",
                        justifyContent: "center",
                        padding: "20px"
                      }}
                    >
                      <LogOut size={20} />
                      Sign Out of Caffeine
                    </button>
                  </section>
                </>
              ) : (
                <>
                  {/* Regional & Language Settings */}
                  <section className="glass-card" style={{ padding: "40px" }}>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <Globe size={24} style={{ color: "var(--accent-blue)" }} />
                      Regional & Language
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {/* Watch Country */}
                      <button 
                        onClick={() => setIsCountryModalOpen(true)}
                        className="settings-nav-button"
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "left" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "24px", height: "18px", borderRadius: "3px", overflow: "hidden", display: "flex", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                            <img 
                              src={currentFlagUrl} 
                              alt={watchCountry} 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            />
                          </div>
                          <div>
                            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.05em" }}>Watch Country</p>
                            <p style={{ fontWeight: 600, color: "white" }}>{watchCountry}</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </button>

                      {/* App Language */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <Languages size={20} className="text-muted" />
                          <div>
                            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.05em" }}>App Language</p>
                            <p style={{ fontWeight: 600 }}>English (US)</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    </div>
                  </section>

                  {/* Playback Preferences */}
                  <section className="glass-card" style={{ padding: "40px" }}>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <Volume2 size={24} style={{ color: "#10b981" }} />
                      Playback Preferences
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                       {/* Audio Language */}
                       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <Volume2 size={20} className="text-muted" />
                          <div>
                            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.05em" }}>Preferred Audio</p>
                            <p style={{ fontWeight: 600 }}>Original (English)</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </div>

                      {/* Subtitles */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <Type size={20} className="text-muted" />
                          <div>
                            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.05em" }}>Subtitles</p>
                            <p style={{ fontWeight: 600 }}>Off • Standard Styling</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    </div>
                  </section>
                </>
              )}


              {/* Version Info */}
              <div style={{ textAlign: "center", marginTop: "40px", opacity: 0.4, fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>
                Caffeine Web v1.2.4 • Built with Passion
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Country Selection Modal */}
      {isCountryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCountryModalOpen(false)}>
          <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "500px", padding: "32px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 900 }}>Select World</h2>
              <button 
                onClick={() => setIsCountryModalOpen(false)}
                className="nav-icon" 
                style={{ padding: "8px", borderRadius: "12px" }}
              >
                <X size={20} />
              </button>
            </header>

            <div style={{ position: "relative", marginBottom: "24px" }}>
              <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search countries..." 
                className="form-input" 
                style={{ paddingLeft: "48px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
              {countries.map(country => (
                <div 
                  key={country.code} 
                  className={`country-item ${watchCountry === country.name ? "active" : ""}`}
                  onClick={() => handleSelectCountry(country.name)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "24px", height: "18px", borderRadius: "3px", overflow: "hidden", display: "flex", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                       <img 
                        src={getFlagUrl(country.code)} 
                        alt={country.name} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    </div>
                    <span style={{ fontWeight: 600 }}>{country.name}</span>
                  </div>
                  {watchCountry === country.name && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsClient;
