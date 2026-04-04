"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Film, 
  Tv, 
  Trophy, 
  History, 
  Search, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  featureFlags?: Record<string, boolean>;
}

const Sidebar: React.FC<SidebarProps> = ({ featureFlags }) => {
  const pathname = usePathname();

  const navItems = [
    { id: "home", icon: Home, label: "Home", path: "/" },
    { id: "movies", icon: Film, label: "Movies", path: "/movies" },
    { id: "tv", icon: Tv, label: "TV Shows", path: "/tv" },
    { 
      id: "live", 
      icon: Trophy, 
      label: "Sports", 
      path: "/live", 
      enabled: featureFlags?.web_live_sports_enabled ?? true 
    },
    { id: "history", icon: History, label: "My History", path: "/#history" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && path.startsWith("/") && pathname === path) return true;
    return false;
  };

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <Link href="/">
        <div style={{ 
          width: "52px", 
          height: "52px", 
          background: "linear-gradient(135deg, var(--primary) 0%, #991b1b 100%)", 
          borderRadius: "16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          fontSize: "1.4rem", 
          fontWeight: 900, 
          marginBottom: "48px", 
          boxShadow: "0 8px 20px var(--primary-glow)",
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "pointer"
        }}>
          C
        </div>
      </Link>

      {/* Main Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
        {navItems.filter(item => item.enabled !== false).map((item) => (
          <Link 
            key={item.id} 
            href={item.path}
            className={`nav-icon ${isActive(item.path) ? "active" : ""}`}
            title={item.label}
          >
            <item.icon size={22} />
          </Link>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "auto" }}>
        <Link 
          href="/search"
          className={`nav-icon ${isActive("/search") ? "active" : ""}`}
          title="Search"
        >
           <Search size={22} />
        </Link>
        <Link 
          href="/settings"
          className={`nav-icon ${isActive("/settings") ? "active" : ""}`}
          title="Settings"
        >
           <Settings size={22} />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
