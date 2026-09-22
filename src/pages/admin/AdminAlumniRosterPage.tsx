import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  ListChecks,
  Loader2,
  RefreshCcw,
  Trash2,
  Unlock,
  UploadCloud,
  UserCheck,
  Users,
} from "lucide-react";
import PageContainer from "../../components/layout/PageContainer";
import { PageHeader, SectionHeader, Badge, EmptyState, ConfirmDialog } from "../../components/shared";
import { Button } from "@/components/ui/button";
import { useToast } from "../../hooks/use-toast";
import {
  deleteRosterEntryApi,
  getRosterImportHistoryApi,
  getRosterStatsApi,
  importRosterFileApi,
  listRosterApi,
  recheckPendingAlumniApi,
  releaseRosterEntryApi,
  rosterTemplateUrl,
  type RosterEntry,
  type RosterImportHistoryItem,
  type RosterImportResult,
  type RosterStats,
} from "../../api/alumniRosterApi";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

const AdminAlumniRosterPage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload / preview flow
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RosterImportResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastImport, setLastImport] = useState<RosterImportResult | null>(null);

  // Roster table
  const [stats, setStats] = useState<RosterStats | null>(null);
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "claimed" | "unclaimed">("");
  const [history, setHistory] = useState<RosterImportHistoryItem[]>([]);
  const [rechecking, setRechecking] = useState(false);

  // Row actions
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RosterEntry | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getRosterStatsApi());
    } catch {
      /* stats are a nice-to-have; the table below is what matters */
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await getRosterImportHistoryApi());
    } catch {
      /* silent — history is shown but not essential */
    }
  }, []);

  const loadEntries = useCallback(
    async (reset: boolean) => {
      reset ? setLoadingEntries(true) : setLoadingMore(true);
      try {
        const page = await listRosterApi({
          q: search || undefined,
          status: statusFilter || undefined,
          after: reset ? undefined : nextCursor || undefined,
          limit: 20,
        });
        setEntries((prev) => (reset ? page.entries : [...prev, ...page.entries]));
        setNextCursor(page.nextCursor);
      } catch (error) {
        toast({
          title: "Could not load the roster",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingEntries(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, statusFilter, nextCursor, toast],
  );

  useEffect(() => {
    loadStats();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEntries(true);
    // Re-run only when search or the status filter changes, not on every cursor advance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const resetUpload = () => {
    setPendingFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChosen = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      toast({
        title: "Unsupported file type",
        description: "Please choose a .csv or .xlsx file.",
        variant: "destructive",
      });
      return;
    }
    setPendingFile(file);
    setPreview(null);
    setPreviewing(true);
    try {
      const result = await importRosterFileApi(file, true);
      setPreview(result);
    } catch (error) {
      toast({
        title: "Could not read the file",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      resetUpload();
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    setConfirming(true);
    try {
      const result = await importRosterFileApi(pendingFile, false);
      setLastImport(result);
      toast({
        title: "Roster imported",
        description: `${result.summary.created} added, ${result.summary.updated} updated${
          result.autoApproval?.approved ? `, ${result.autoApproval.approved} pending alumni approved automatically` : ""
        }.`,
      });
      resetUpload();
      loadStats();
      loadHistory();
      loadEntries(true);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleRecheckPending = async () => {
    setRechecking(true);
    try {
      const result = await recheckPendingAlumniApi();
      toast({
        title: "Pending alumni re-checked",
        description:
          result.approved > 0
            ? `${result.approved} of ${result.checked} pending account${result.checked === 1 ? "" : "s"} approved.`
            : `No matches yet (${result.checked} pending account${result.checked === 1 ? "" : "s"} checked).`,
      });
    } catch (error) {
      toast({
        title: "Could not re-check pending alumni",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRechecking(false);
    }
  };

  const handleRelease = async (entry: RosterEntry) => {
    setBusyEntryId(entry._id);
    try {
      await releaseRosterEntryApi(entry._id);
      toast({ title: "Claim released", description: `${entry.registrationNumber} can now be claimed again.` });
      loadEntries(true);
      loadStats();
    } catch (error) {
      toast({
        title: "Could not release the claim",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyEntryId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyEntryId(confirmDelete._id);
    try {
      await deleteRosterEntryApi(confirmDelete._id);
      toast({ title: "Entry deleted", description: confirmDelete.registrationNumber });
      setConfirmDelete(null);
      loadEntries(true);
      loadStats();
    } catch (error) {
      toast({
        title: "Could not delete this entry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyEntryId(null);
    }
  };

  return (
    <PageContainer title="Alumni Roster">
      <div className="space-y-6">
        <PageHeader
          icon={FileSpreadsheet}
          title="Alumni Roster"
          subtitle="Upload the official list of alumni so matching registration numbers are approved automatically, instead of one by one."
          actions={
            <a
              href={rosterTemplateUrl()}
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
              download
            >
              <Download className="h-4 w-4" /> Download template
            </a>
          }
        />

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "In the roster", value: stats?.total, icon: Users, accent: "bg-brand-primary" },
            { label: "Claimed", value: stats?.claimed, icon: UserCheck, accent: "bg-emerald-500" },
            { label: "Unclaimed", value: stats?.unclaimed, icon: ListChecks, accent: "bg-amber-500" },
            { label: "Imports so far", value: history.length, icon: UploadCloud, accent: "bg-indigo-500" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${s.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Upload */}
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <SectionHeader
            icon={UploadCloud}
            title="Import a roster file"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecheckPending}
                disabled={rechecking}
              >
                {rechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                Re-check pending alumni
              </Button>
            }
          />

          {!pendingFile ? (
            <label
              className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/20 px-6 py-10 text-center transition-colors hover:border-brand-primary/40 hover:bg-muted/30"
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileChosen(file);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <FileUp className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Drag a .csv or .xlsx file here, or click to choose one
              </p>
              <p className="text-xs text-muted-foreground">
                Needs a registrationNumber and fullName column. Download the template above for the exact format.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChosen(file);
                }}
              />
            </label>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileSpreadsheet className="h-4 w-4 text-brand-primary" />
                  {pendingFile.name}
                </div>
                <Button variant="ghost" size="sm" onClick={resetUpload} disabled={confirming}>
                  Choose a different file
                </Button>
              </div>

              {previewing ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading the file…
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{preview.totalRows}</p>
                      <p className="text-xs text-muted-foreground">Rows in file</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 text-center">
                      <p className="text-lg font-bold text-emerald-700">{preview.summary.created}</p>
                      <p className="text-xs text-emerald-700/80">New entries</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-3 text-center">
                      <p className="text-lg font-bold text-indigo-700">{preview.summary.updated}</p>
                      <p className="text-xs text-indigo-700/80">Will update</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-lg font-bold text-red-700">{preview.errorRows}</p>
                      <p className="text-xs text-red-700/80">Rows with errors</p>
                    </div>
                  </div>

                  {preview.summary.skippedClaimed > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {preview.summary.skippedClaimed} row{preview.summary.skippedClaimed === 1 ? "" : "s"} already
                      claimed by a registered user and will be left untouched.
                    </p>
                  )}

                  {preview.errors.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50/60">
                      <div className="flex items-center gap-2 border-b border-red-200 px-4 py-2 text-sm font-semibold text-red-800">
                        <AlertTriangle className="h-4 w-4" /> Rows that will be skipped
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-red-700/70">
                            <tr>
                              <th className="px-4 py-1.5 font-medium">Row</th>
                              <th className="px-4 py-1.5 font-medium">Registration number</th>
                              <th className="px-4 py-1.5 font-medium">Problem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.errors.map((err) => (
                              <tr key={err.row} className="border-t border-red-100">
                                <td className="px-4 py-1.5 text-red-900">{err.row}</td>
                                <td className="px-4 py-1.5 font-mono text-red-900">{err.registrationNumber || "—"}</td>
                                <td className="px-4 py-1.5 text-red-800">{err.problems.join("; ")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleConfirmImport} disabled={confirming || preview.validRows === 0}>
                      {confirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Importing…
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" /> Import {preview.validRows} row
                          {preview.validRows === 1 ? "" : "s"}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetUpload} disabled={confirming}>
                      Cancel
                    </Button>
                    {preview.validRows === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Fix the errors above and choose the file again.
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {lastImport && !pendingFile && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Last import ({lastImport.fileName}): {lastImport.summary.created} added,{" "}
                {lastImport.summary.updated} updated
                {lastImport.autoApproval?.approved
                  ? `, ${lastImport.autoApproval.approved} pending alumni approved automatically`
                  : ""}
                .
              </span>
            </div>
          )}
        </section>

        {/* Roster table */}
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <SectionHeader icon={ListChecks} title="Roster entries" />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by registration number or name…"
              className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              {(["", "unclaimed", "claimed"] as const).map((value) => (
                <button
                  key={value || "all"}
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === value
                      ? "bg-brand-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {value === "" ? "All" : value === "unclaimed" ? "Unclaimed" : "Claimed"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loadingEntries ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="No roster entries yet"
                description="Import a CSV or Excel file above to get started."
                compact
              />
            ) : (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Registration number</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Department</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Updated</th>
                    <th className="py-2 pr-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry._id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-xs">{entry.registrationNumber}</td>
                      <td className="py-2.5 pr-3">{entry.fullName}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{entry.department || "—"}</td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={entry.status === "claimed" ? "success" : "outline"}>
                          {entry.status === "claimed" ? "Claimed" : "Unclaimed"}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">{formatWhen(entry.updatedAt)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex justify-end gap-1">
                          {entry.status === "claimed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRelease(entry)}
                              disabled={busyEntryId === entry._id}
                              title="Release this claim without changing the user's account"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(entry)}
                            disabled={busyEntryId === entry._id || entry.status === "claimed"}
                            title={entry.status === "claimed" ? "Release the claim before deleting" : "Delete"}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {nextCursor && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => loadEntries(false)} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Load more
              </Button>
            </div>
          )}
        </section>

        {/* Import history */}
        {history.length > 0 && (
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionHeader icon={UploadCloud} title="Import history" />
            <div className="mt-4 space-y-2">
              {history.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 rounded-lg bg-muted/20 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.uploadedByEmail || "Unknown admin"} · {formatWhen(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="text-emerald-700">+{item.created}</span>
                    <span className="text-indigo-700">~{item.updated}</span>
                    {item.errorRows > 0 && <span className="text-red-700">{item.errorRows} errors</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this roster entry?"
        description={
          confirmDelete ? (
            <>
              This removes <span className="font-mono">{confirmDelete.registrationNumber}</span> (
              {confirmDelete.fullName}) from the roster. This does not affect any existing user account.
            </>
          ) : null
        }
        confirmLabel="Delete"
        loading={busyEntryId === confirmDelete?._id}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
};

export default AdminAlumniRosterPage;
