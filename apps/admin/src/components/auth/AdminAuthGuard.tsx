"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ShieldAlert, LogOut, ExternalLink, Loader2 } from "lucide-react";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const isLoginPage = pathname === "/login";

  // Redirect unauthenticated users to /login when attempting to access protected routes
  useEffect(() => {
    if (!isPending && !session?.user && !isLoginPage) {
      router.replace("/login");
    }
  }, [isPending, session, isLoginPage, router]);

  // Redirect authenticated admin users away from /login to dashboard
  useEffect(() => {
    if (!isPending && session?.user && (session.user as { role?: string }).role === "admin" && isLoginPage) {
      router.replace("/analytics");
    }
  }, [isPending, session, isLoginPage, router]);

  // If on login page, render login UI directly without sidebar/header
  if (isLoginPage) {
    return <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center">{children}</div>;
  }

  // Loading session verification
  if (isPending) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex flex-col items-center justify-center text-zinc-300">
        <div className="p-8 rounded-2xl bg-[#121217] border border-[#27272A] flex flex-col items-center gap-4 max-w-sm text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-100 font-mono">
              LaserTag HQ Console
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Verifying Command Clearance...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, render loading screen while redirect takes place
  if (!session?.user) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const userRole = (session.user as { role?: string }).role;

  // Logged in with Google or credentials, but not an admin!
  if (userRole !== "admin") {
    const handleSignOutAndSwitch = async () => {
      await signOut();
      router.push("/login");
    };

    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#121217] border border-red-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 mb-2">
              Unauthorized Access
            </span>

            <h1 className="text-xl font-bold tracking-wide text-zinc-100 uppercase">
              Command Clearance Required
            </h1>

            <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
              You are authenticated as <strong className="text-zinc-200">{session.user.email}</strong>, but this account does not possess <span className="text-red-400 font-semibold">ADMIN</span> privileges.
            </p>

            <div className="w-full my-6 p-4 rounded-xl bg-[#18181B] border border-[#27272A] text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Operative Name:</span>
                <span className="text-zinc-200 font-semibold">{session.user.name || "N/A"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Current Role:</span>
                <span className="text-amber-400 uppercase font-semibold">{userRole || "user"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Required Role:</span>
                <span className="text-emerald-400 uppercase font-semibold">admin</span>
              </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSignOutAndSwitch}
                className="flex-1 py-2.5 px-4 bg-[#1F1F24] hover:bg-[#27272A] border border-[#3F3F46] text-zinc-200 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Switch Account
              </button>

              <a
                href={process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}
                className="flex-1 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-red-200 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Player Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated as admin: render admin layout
  return (
    <div className="min-h-screen flex antialiased w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
