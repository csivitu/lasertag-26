"use client";

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
} from "lucide-react";

const NAV_MAIN = [
  { name: "Overview", href: "/analytics", icon: LayoutDashboard },
  { name: "Slot Manager", href: "/slots", icon: CalendarDays },
  { name: "Check-In Station", href: "/checkin", icon: QrCode },
  // DEPRECATED: team feature disabled — uncomment to restore.
  // { name: "Team & Roster", href: "/teams", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#141417] border-r border-[#27272A] flex flex-col h-screen sticky top-0 z-30 shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#27272A] flex items-center justify-center p-1 border border-[#3F3F46]/50">
            <Image
              src="/logo.svg"
              alt="LaserTag Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm text-[#FAFAFA] tracking-tight">LaserTag '26</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#27272A] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
        </span>
      </div>

      {/* Quick Search Input */}
      <div className="p-3">
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
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#71717A] font-mono">
            Workstations
          </div>
          <div className="space-y-1">
            {NAV_MAIN.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (pathname === "/" && item.href === "/analytics");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#27272A] text-[#FAFAFA] shadow-sm font-semibold"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#FAFAFA]" : "text-[#71717A]"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#27272A] bg-[#09090B]/50 text-xs text-[#71717A] flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#A1A1AA]">Admin Workstation</span>
        <span className="font-mono text-[10px] bg-[#27272A] px-2 py-0.5 rounded-full text-[#FAFAFA]">v1.0</span>
      </div>
    </aside>
  );
}
