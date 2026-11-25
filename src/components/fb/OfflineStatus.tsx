import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localIdentity, pendingRecords, syncSiteRecords, type PendingSiteRecord } from "@/lib/offline";
import { PROJECT_ID } from "@/lib/db";

export function OfflineStatus({ online }: { online: boolean }) {
  const [jobs, setJobs] = useState<PendingSiteRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    let disposed = false;
    const refresh = async () => {
      try {
        const user = await localIdentity();
        const records = user ? await pendingRecords(user.id, PROJECT_ID) : [];
        if (!disposed) { setJobs(records); setStorageError(false); }
        await queryClient.invalidateQueries({ predicate: (q) => ["rfis", "snags", "drawing_pins"].includes(String(q.queryKey[0])) });
      } catch { if (!disposed) setStorageError(true); }
    };
    const onChange = () => { void refresh(); };
    void refresh();
    window.addEventListener("fieldbridge-offline", onChange);
    const onStorageError = () => setStorageError(true);
    window.addEventListener("fieldbridge-storage-error", onStorageError);
    return () => { disposed = true; window.removeEventListener("fieldbridge-offline", onChange); window.removeEventListener("fieldbridge-storage-error", onStorageError); };
  }, [queryClient]);
  useEffect(() => {
    if (!online) return;
    const sync = () => { void syncSiteRecords(PROJECT_ID).catch(() => setStorageError(true)); };
    sync();
    const interval = window.setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", sync); };
  }, [online]);
  if (online && !jobs.length && !storageError) return null;
  const blocked = jobs.filter((j) => j.error);
  return <div role="status" className="flex flex-wrap items-center gap-2 border-b bg-muted px-4 py-2 text-sm text-foreground">
    {!online && <WifiOff className="h-4 w-4 shrink-0" />}
    <span className="min-w-0 flex-1">{storageError ? "Device storage unavailable" : `${online ? "Connected" : "Offline"} · ${jobs.length} awaiting sync`}{blocked.length > 0 && ` · ${blocked.length} need retry`}</span>
    {online && jobs.length > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { await syncSiteRecords(PROJECT_ID); } finally { setBusy(false); } }}><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />Retry sync</Button>}
    {blocked.map((j) => <p key={j.id} className="w-full break-words text-xs text-destructive">{String(j.writes[0]?.row['title'] ?? j.writes[0]?.row['note'] ?? j.writes[0]?.row['defect_description'] ?? "Site record")}: {j.error}</p>)}
  </div>;
}