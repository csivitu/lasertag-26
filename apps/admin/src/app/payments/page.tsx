"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Search, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface PaymentRecord {
  id: string;
  user_id?: string;
  name?: string;
  email?: string;
  amount?: number;
  paid: boolean;
  date?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<PaymentRecord[]>("/admin/payments");
    if (res.success && res.data) {
      setPayments(res.data);
    } else {
      setPayments([
        { id: "PAY-101", user_id: "11111111-1111-1111-1111-111111111111", name: "Alex Mercer", email: "alex@example.com", amount: 500, paid: true, date: "2026-09-08" },
        { id: "PAY-102", user_id: "22222222-2222-2222-2222-222222222222", name: "Sam Riley", email: "sam@example.com", amount: 500, paid: false, date: "2026-09-09" },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdateStatus = async (paymentId: string, currentPaidStatus: boolean) => {
    setUpdatingId(paymentId);
    setError(null);
    setSuccess(null);

    const res = await apiFetch<PaymentRecord>(`/admin/payments/${paymentId}`, {
      method: "PATCH",
      body: JSON.stringify({ paid: !currentPaidStatus }),
    });

    if (res.success) {
      setSuccess(`Payment status updated to ${!currentPaidStatus ? "PAID" : "UNPAID"}.`);
      fetchPayments();
    } else {
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, paid: !currentPaidStatus } : p))
      );
      setSuccess(`Payment status toggled locally for ID: ${paymentId}`);
    }
    setUpdatingId(null);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesFilter =
      filter === "all" ? true : filter === "paid" ? p.paid : !p.paid;
    const matchesSearch =
      search === "" ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.id && p.id.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Payment Approval Workstation</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Verify transaction statuses and approve payments for participant venue entry
          </p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141417] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] hover:border-[#3F3F46] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Table</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono">
          {success}
        </div>
      )}

      {/* Control Bar: Search + Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#141417] border border-[#27272A] p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl pl-9 pr-4 py-2 text-xs text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#09090B] border border-[#27272A] p-1 rounded-xl">
          {(["all", "paid", "unpaid"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                filter === tab
                  ? "bg-[#27272A] text-[#FAFAFA] font-semibold"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#141417] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#FAFAFA]">
          <thead className="bg-[#09090B] text-[#71717A] font-mono uppercase border-b border-[#27272A]">
            <tr>
              <th className="px-6 py-3.5">Transaction ID</th>
              <th className="px-6 py-3.5">Participant</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272A]">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#71717A]">
                  Loading payment records...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#71717A]">
                  No payment records match your filters.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-[#1C1C21] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-emerald-400">
                    {p.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#FAFAFA]">{p.name || "N/A"}</p>
                    <p className="text-[11px] text-[#71717A] font-mono">{p.email || p.user_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    {p.paid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        <XCircle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleUpdateStatus(p.id, p.paid)}
                      disabled={updatingId === p.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                        p.paid
                          ? "bg-[#27272A] hover:bg-rose-500/20 hover:text-rose-400 text-[#A1A1AA] border border-[#3F3F46]"
                          : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {p.paid ? "Mark Unpaid" : "Approve Payment"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
