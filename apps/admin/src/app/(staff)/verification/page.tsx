"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Search, RefreshCw, ShieldCheck, Upload, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getStaffRole } from "@/lib/auth";

const PAGE_SIZE = 10;

function Pager({
  page,
  totalPages,
  onPage,
  status,
  forceShow,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  status?: string;
  forceShow?: boolean;
}) {
  if (totalPages <= 1 && !forceShow) return null;
  const navDisabled = totalPages <= 1;
  return (
    <div className="px-6 py-3 border-t border-[#27272A] flex items-center justify-between bg-[#09090B]">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={navDisabled || page <= 1}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>
      <span className="text-[11px] font-mono text-[#71717A]">
        {status ?? `Page ${page} of ${totalPages}`}
      </span>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={navDisabled || page >= totalPages}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface PaymentRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  paid: boolean;
}

interface ImportSummary {
  message: string;
  dryRun: boolean;
  filename?: string;
  total: number;
  allowlisted: number;
  alreadyListed: number;
  newlyPaid: number;
  alreadyPaid: number;
  totalVerified?: number;
  invalid: { rowNumber: number; value: string | null; name: string | null; reason: string }[];
  failed: { rowNumber: number; value: string | null; name: string | null; reason: string }[];
}

export default function VerificationPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Paid-list import state
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  // Pasted-list import state
  const [pasteText, setPasteText] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pastePreview, setPastePreview] = useState<ImportSummary | null>(null);
  const [pasteResult, setPasteResult] = useState<ImportSummary | null>(null);

  // Allowlist state (server-driven: search + total survive past the fetch cap)
  const [allowlist, setAllowlist] = useState<
    { id: string; regNumber: string | null; email: string | null; name: string | null; source: string }[]
  >([]);
  const [allowlistLoading, setAllowlistLoading] = useState(false);
  const [allowPage, setAllowPage] = useState(1);
  const [allowTotal, setAllowTotal] = useState(0);
  const [allowSearch, setAllowSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<PaymentRow[]>("/admin/payments");
    if (res.success && res.data) {
      setPayments(res.data);
    } else {
      setPayments([]);
      setError(res.error || "Could not load payment records.");
    }
    setLoading(false);
  };

  useEffect(() => {
    getStaffRole().then((r) => {
      // Plain admins have no verification access — bounce to check-in.
      if (r !== "super_admin") router.replace("/checkin");
      else setIsSuperAdmin(true);
    });
    fetchPayments();
    fetchAllowlist();
  }, []);

  const handleUpdateStatus = async (paymentId: string, currentPaidStatus: boolean) => {
    setUpdatingId(paymentId);
    setError(null);
    setSuccess(null);

    const res = await apiFetch<unknown>(`/admin/payments/${paymentId}`, {
      method: "PATCH",
      body: JSON.stringify({ paid: !currentPaidStatus }),
    });

    if (res.success) {
      setSuccess(`Payment status updated to ${!currentPaidStatus ? "PAID" : "UNPAID"}.`);
      fetchPayments();
    } else {
      setError(res.error || "Could not update payment status.");
    }
    setUpdatingId(null);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesFilter =
      filter === "all" ? true : filter === "paid" ? p.paid : !p.paid;
    const matchesSearch =
      search === "" ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Reset to first page whenever the result set changes
  useEffect(() => {
    setPage(1);
  }, [filter, search, payments.length]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPayments = filteredPayments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allowTotalPages = Math.max(1, Math.ceil(allowTotal / PAGE_SIZE));
  const safeAllowPage = Math.min(allowPage, allowTotalPages);
  const pagedAllowlist = allowlist;
  const allowRangeStart = allowTotal === 0 ? 0 : (safeAllowPage - 1) * PAGE_SIZE + 1;
  const allowRangeEnd = Math.min(safeAllowPage * PAGE_SIZE, allowTotal);
  const allowStatus = allowlistLoading
    ? "Loading verified list…"
    : allowTotal === 0
      ? "No verified entries loaded — press Refresh."
      : `Showing ${allowRangeStart}–${allowRangeEnd} of ${allowTotal}`;

  const applyImportSuccess = (data: ImportSummary) => {
    // Prefer the server's fresh total; fall back to a local refetch below.
    if (typeof data.totalVerified === "number") setAllowTotal(data.totalVerified);
    const failedNote =
      data.failed && data.failed.length > 0
        ? ` ${data.failed.length} row${data.failed.length === 1 ? "" : "s"} failed (listed below) — everything else applied.`
        : "";
    return failedNote;
  };

  const runImport = async (dryRun: boolean) => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an .xlsx or .csv participant list first.");
      return;
    }
    setImporting(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await apiFetch<ImportSummary>(
      `/admin/payments/import${dryRun ? "?dryRun=true" : ""}`,
      { method: "POST", body: form }
    );
    setImporting(false);
    if (!res.success || !res.data) {
      setError(res.error || "Import failed.");
      return;
    }
    if (dryRun) {
      setPreview(res.data);
      setImportResult(null);
    } else {
      setImportResult(res.data);
      setPreview(null);
      const failedNote = applyImportSuccess(res.data);
      setSuccess(
        `Stored ${res.data.allowlisted} new + ${res.data.alreadyListed} already-listed identities; ` +
        `${res.data.newlyPaid} participant${res.data.newlyPaid === 1 ? "" : "s"} marked paid (${res.data.alreadyPaid} already paid).` +
        (typeof res.data.totalVerified === "number" ? ` Total verified: ${res.data.totalVerified}.` : "") +
        failedNote
      );
      fetchPayments();
      fetchAllowlist(1, allowSearch);
      setAllowPage(1);
    }
  };

  const fetchAllowlist = async (pageArg?: number, searchArg?: string) => {
    setAllowlistLoading(true);
    const p = pageArg ?? allowPage;
    const q = searchArg ?? allowSearch;
    const offset = (Math.max(1, p) - 1) * PAGE_SIZE;
    const res = await apiFetch<{ data?: { id: string; regNumber: string | null; email: string | null; name: string | null; source: string }[]; total?: number }>(
      `/admin/payments/allowlist?limit=${PAGE_SIZE}&offset=${offset}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`
    );
    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        // `apiFetch` unwraps the `{ data, total }` envelope into `data`, so
        // the server-side total lives on `raw`, not on the array itself.
        setAllowlist(res.data as unknown as { id: string; regNumber: string | null; email: string | null; name: string | null; source: string }[]);
        const rawTotal = (res.raw as { total?: unknown } | undefined)?.total;
        if (typeof rawTotal === "number") setAllowTotal(rawTotal);
      } else {
        setAllowlist(res.data.data ?? []);
        if (typeof res.data.total === "number") setAllowTotal(res.data.total);
      }
    }
    setAllowlistLoading(false);
  };

  // Debounced server search — works past the fetch cap.
  useEffect(() => {
    const t = setTimeout(() => {
      setAllowPage(1);
      fetchAllowlist(1, allowSearch);
    }, 350);
    return () => clearTimeout(t);
  }, [allowSearch]);

  const runPaste = async (dryRun: boolean) => {
    if (!pasteText.trim()) {
      setError("Paste some reg numbers or emails first.");
      return;
    }
    setPasting(true);
    setError(null);
    const res = await apiFetch<ImportSummary>(
      `/admin/payments/import-text${dryRun ? "?dryRun=true" : ""}`,
      { method: "POST", body: JSON.stringify({ text: pasteText }) }
    );
    setPasting(false);
    if (!res.success || !res.data) {
      setError(res.error || "Paste import failed. Super-admin access is required.");
      return;
    }
    if (dryRun) {
      setPastePreview(res.data);
      setPasteResult(null);
    } else {
      setPasteResult(res.data);
      setPastePreview(null);
      setPasteText("");
      const failedNote = applyImportSuccess(res.data);
      setSuccess(
        `Stored ${res.data.allowlisted} new + ${res.data.alreadyListed} already-listed identities; ` +
        `${res.data.newlyPaid} participant${res.data.newlyPaid === 1 ? "" : "s"} marked paid.` +
        (typeof res.data.totalVerified === "number" ? ` Total verified: ${res.data.totalVerified}.` : "") +
        failedNote
      );
      fetchPayments();
      fetchAllowlist(1, allowSearch);
      setAllowPage(1);
    }
  };

  // Plain admins bounce to check-in (see effect above) — render nothing meanwhile.
  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Verification Workstation</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Upload the official participant list to verify payments, or approve them one by one below
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

      {/* Paid-list import card */}
      <div className="bg-[#141417] border border-[#27272A] p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-[#FAFAFA]">Paid participant list</h2>
        </div>
        <p className="text-[11px] text-[#71717A] font-mono">
          Upload the official .xlsx or .csv (needs a Reg No / Registration Number column, email as fallback).
          Matches are marked paid — anyone missing from the sheet is left untouched.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="flex-1 text-xs text-[#A1A1AA] file:mr-3 file:px-3 file:py-1.5 file:rounded-xl file:border file:border-[#3F3F46] file:bg-[#27272A] file:text-[#FAFAFA] file:text-xs file:font-medium hover:file:bg-[#3F3F46] file:cursor-pointer file:transition-all"
          />
          <button
            onClick={() => runImport(true)}
            disabled={importing}
            className="px-3 py-1.5 bg-[#27272A] border border-[#3F3F46] rounded-xl text-xs text-[#FAFAFA] hover:bg-[#3F3F46] transition-all disabled:opacity-50"
          >
            {importing ? "Working..." : "Preview"}
          </button>
          <button
            onClick={() => runImport(false)}
            disabled={importing}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs text-slate-950 font-bold transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {importing ? "Working..." : "Confirm & Apply"}
          </button>
        </div>

        {preview && (
          <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs font-mono space-y-1">
            <p className="text-[#FAFAFA] font-bold">
              Preview{preview.filename ? `: ${preview.filename}` : ""} — {preview.total} rows
            </p>
            <p className="text-emerald-400">
              {preview.allowlisted} would be stored · {preview.alreadyListed} already listed ·{" "}
              {preview.newlyPaid} would be marked paid · {preview.alreadyPaid} already paid
            </p>
            {preview.invalid.length > 0 && (
              <div className="pt-1">
                <p className="text-amber-300">{preview.invalid.length} invalid rows (skipped):</p>
                <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {preview.invalid.slice(0, 20).map((u) => (
                    <li key={u.rowNumber} className="text-[#71717A]">
                      row {u.rowNumber}: {u.value || u.name || "?"} — {u.reason}
                    </li>
                  ))}
                  {preview.invalid.length > 20 && (
                    <li className="text-[#71717A]">…and {preview.invalid.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {importResult && !preview && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono space-y-1">
            <p className="text-emerald-400 font-bold">
              Applied: {importResult.allowlisted} stored · {importResult.alreadyListed} already listed ·{" "}
              {importResult.newlyPaid} newly paid · {importResult.alreadyPaid} already paid
              {typeof importResult.totalVerified === "number" ? ` · total verified: ${importResult.totalVerified}` : ""}
            </p>
            {importResult.failed && importResult.failed.length > 0 && (
              <div className="pt-1">
                <p className="text-amber-300">{importResult.failed.length} rows failed (everything else applied):</p>
                <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {importResult.failed.slice(0, 20).map((f) => (
                    <li key={f.rowNumber} className="text-[#71717A]">
                      row {f.rowNumber}: {f.value || f.name || "?"} — {f.reason}
                    </li>
                  ))}
                  {importResult.failed.length > 20 && (
                    <li className="text-[#71717A]">…and {importResult.failed.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pasted-list import card (super admin only) */}
      <div className="bg-[#141417] border border-[#27272A] p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-[#FAFAFA]">Paste a list directly</h2>
        </div>
        <p className="text-[11px] text-[#71717A] font-mono">
          One reg number or email per line — copying a column straight from a sheet works too.
          Anything with @ counts as an email, everything else as a reg number. Super-admin only.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={4}
          placeholder={"23BCE1234\n23BCE5678\nplayer@vitstudent.ac.in"}
          className="w-full bg-[#09090B] border border-[#27272A] rounded-xl p-3 text-xs text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46] font-mono"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => runPaste(true)}
            disabled={pasting}
            className="px-3 py-1.5 bg-[#27272A] border border-[#3F3F46] rounded-xl text-xs text-[#FAFAFA] hover:bg-[#3F3F46] transition-all disabled:opacity-50"
          >
            {pasting ? "Working..." : "Preview"}
          </button>
          <button
            onClick={() => runPaste(false)}
            disabled={pasting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs text-slate-950 font-bold transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {pasting ? "Working..." : "Confirm & Apply"}
          </button>
        </div>

        {pastePreview && (
          <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs font-mono space-y-1">
            <p className="text-[#FAFAFA] font-bold">Preview — {pastePreview.total} values</p>
            <p className="text-emerald-400">
              {pastePreview.allowlisted} would be stored · {pastePreview.alreadyListed} already listed ·{" "}
              {pastePreview.newlyPaid} would be marked paid
            </p>
            {pastePreview.invalid.length > 0 && (
              <p className="text-amber-300">{pastePreview.invalid.length} invalid values (skipped).</p>
            )}
          </div>
        )}

        {pasteResult && !pastePreview && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono space-y-1">
            <p className="text-emerald-400 font-bold">
              Applied: {pasteResult.allowlisted} stored · {pasteResult.alreadyListed} already listed ·{" "}
              {pasteResult.newlyPaid} newly paid
              {typeof pasteResult.totalVerified === "number" ? ` · total verified: ${pasteResult.totalVerified}` : ""}
            </p>
            {pasteResult.failed && pasteResult.failed.length > 0 && (
              <div className="pt-1">
                <p className="text-amber-300">{pasteResult.failed.length} values failed (everything else applied):</p>
                <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {pasteResult.failed.slice(0, 20).map((f) => (
                    <li key={f.rowNumber} className="text-[#71717A]">
                      row {f.rowNumber}: {f.value || f.name || "?"} — {f.reason}
                    </li>
                  ))}
                  {pasteResult.failed.length > 20 && (
                    <li className="text-[#71717A]">…and {pasteResult.failed.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allowlist snapshot (server search + total — additive only, rows never deleted) */}
      <div className="bg-[#141417] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-3.5 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <h2 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider">
            Verified list <span className="text-[#71717A]">({allowTotal})</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search reg no, email, name..."
                value={allowSearch}
                onChange={(e) => setAllowSearch(e.target.value)}
                className="bg-[#09090B] border border-[#27272A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#3F3F46] w-56"
              />
            </div>
            <button
              onClick={() => fetchAllowlist(safeAllowPage, allowSearch)}
              disabled={allowlistLoading}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            >
              {allowlistLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs text-[#FAFAFA]">
          <thead className="bg-[#09090B] text-[#71717A] font-mono uppercase border-b border-[#27272A]">
            <tr>
              <th className="px-6 py-3">Reg No</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3 text-right">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272A]">
            {allowlistLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-[#71717A]">
                  Loading verified list...
                </td>
              </tr>
            ) : allowlist.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-[#71717A]">
                  {allowSearch.trim()
                    ? `No verified entries match "${allowSearch.trim()}".`
                    : "Nothing verified yet — upload or paste a list above."}
                </td>
              </tr>
            ) : (
              pagedAllowlist.map((e) => (
                <tr key={e.id} className="hover:bg-[#1C1C21] transition-colors">
                  <td className="px-6 py-2.5 font-mono text-xs text-emerald-400">{e.regNumber || "—"}</td>
                  <td className="px-6 py-2.5 font-mono text-[11px] text-[#A1A1AA]">{e.email || "—"}</td>
                  <td className="px-6 py-2.5 text-[#FAFAFA]">{e.name || "—"}</td>
                  <td className="px-6 py-2.5 text-right text-[11px] font-mono text-[#71717A]">{e.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pager
          page={safeAllowPage}
          totalPages={allowTotalPages}
          forceShow
          status={allowStatus}
          onPage={(p) => {
            setAllowPage(p);
            fetchAllowlist(p, allowSearch);
          }}
        />
      </div>

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
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs text-[#FAFAFA]">
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
              pagedPayments.map((p) => (
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
        {!loading && filteredPayments.length > 0 && (
          <Pager page={safePage} totalPages={totalPages} onPage={setPage} />
        )}
      </div>
    </div>
  );
}
