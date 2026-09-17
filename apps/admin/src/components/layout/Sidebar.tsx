"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  QrCode,
  // DEPRECATED: team feature disabled — re-add Users to restore Teams nav.
  // Users,
  Search,
  UserSearch,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import { getStaffRole, type StaffRole } from "@/lib/auth";

const NAV_MAIN = [
  { name: "Overview", href: "/analytics", icon: LayoutDashboard },
  { name: "Solo Users", href: "/users", icon: UserSearch },
  { name: "Verification", href: "/verification", icon: ShieldCheck, superOnly: true },
  { name: "Slot Manager", href: "/slots", icon: CalendarDays, superOnly: true },
  { name: "Check-In Station", href: "/checkin", icon: QrCode },
  // DEPRECATED: team feature disabled — uncomment to restore.
  // { name: "Team & Roster", href: "/teams", icon: Users },
];

/** Dispatched by the Header hamburger (mobile) / collapse button (desktop). */
export function toggleAdminSidebar() {
  window.dispatchEvent(new CustomEvent("admin:toggle-sidebar"));
}

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    getStaffRole().then(setRole);
  }, []);

  // Plain admins never see super-admin workstations.
  const visibleNav = NAV_MAIN.filter((item) => !("superOnly" in item) || role === "super_admin");

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Private mode — default expanded.
    }
  }, []);

  useEffect(() => {
    const onToggle = () => {
      if (window.innerWidth < 1024) {
        setMobileOpen((v) => !v);
      } else {
        setCollapsed((v) => {
          try {
            window.localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
          } catch {
            // Ignore storage failures.
          }
          return !v;
        });
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("admin:toggle-sidebar", onToggle);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("admin:toggle-sidebar", onToggle);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close the drawer on navigation; lock body scroll while it's open.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`bg-[#141417] border-r border-[#27272A] flex flex-col h-screen top-0 z-50 shrink-0 select-none transition-all duration-200
          fixed lg:sticky
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-72 lg:w-16" : "w-72 lg:w-64"}`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-[#27272A] flex items-center justify-center p-1 border border-[#3F3F46]/50">
              <Image
                src="/logo.svg"
                alt="LaserTag Logo"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className={`font-bold text-sm text-[#FAFAFA] tracking-tight truncate ${collapsed ? "lg:hidden" : ""}`}>
              LaserTag '26
            </span>
          </div>
          <div className={`flex items-center gap-2 ${collapsed ? "lg:hidden" : ""}`}>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#27272A] text-emerald-400 font-semibold hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="lg:hidden p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className={`p-3 ${collapsed ? "lg:hidden" : ""}`}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search workstation..."
              className="w-full bg-[#09090B] border border-[#27272A] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46]"
              readOnly
            />
            <kbd className="absolute right-2.5 top-2 text-[9px] font-mono text-[#71717A] bg-[#27272A] px-1 rounded">⌘F</kbd>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <div className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#71717A] font-mono ${collapsed ? "lg:hidden" : ""}`}>
              Workstations
            </div>
            <div className="space-y-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (pathname === "/" && item.href === "/analytics");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-[#27272A] text-[#FAFAFA] shadow-sm font-semibold"
                        : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                    } ${collapsed ? "lg:justify-center lg:px-2" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FAFAFA]" : "text-[#71717A]"}`} />
                      <span className={collapsed ? "lg:hidden" : ""}>{item.name}</span>
                    </div>
                    {isActive && !collapsed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#27272A] bg-[#09090B]/50 text-xs text-[#71717A] flex items-center justify-between">
          <span className={`font-mono text-[11px] text-[#A1A1AA] ${collapsed ? "lg:hidden" : ""}`}>Admin Workstation</span>
          <div className="flex items-center gap-2">
            <span className="lg:hidden font-mono text-[10px] bg-[#27272A] px-2 py-0.5 rounded-full text-[#FAFAFA]">v1.0</span>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => toggleAdminSidebar()}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:flex p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
