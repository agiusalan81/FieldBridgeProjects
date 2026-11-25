import { useState } from "react";
import { ItemChat } from "./Collab";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { db, useRefresh, type Row } from "@/lib/db";
import { DeleteMistake } from "./Workflow";
import { PhotoPicker } from "./PhotoPicker";

export function SnagCard({ s, level, pkg, canVerify }: { s: Row; level?: string; pkg?: string; canVerify?: boolean }) {
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  async function update(patch: Row, msg: string) {
    setBusy(true);
    const { error } = await db.from("snags").update(patch).eq("id", s.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(msg); refresh("snags");
  }
  const overdue = s.status === "Open" && s.rectify_by_date && new Date(s.rectify_by_date) < new Date(new Date().toDateString());
  return (
    <div className={`overflow-hidden rounded-md border bg-card ${s.severity.startsWith("Critical") ? "border-l-4 border-l-destructive" : ""}`}>
      <div className="grid grid-cols-2">
        <div className="relative aspect-[4/3] bg-muted">{s.photo_defect_url && <img src={s.photo_defect_url} alt="Defect" className="h-full w-full object-cover" loading="lazy" />}<span className="absolute left-1 top-1 rounded bg-shell px-1.5 text-[10px] text-shell-foreground">DEFECT</span></div>
        <div className="relative aspect-[4/3] bg-muted">{s.photo_rectified_url ? <img src={s.photo_rectified_url} alt="Rectified" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No fix photo yet</div>}<span className="absolute left-1 top-1 rounded bg-success px-1.5 text-[10px] text-success-foreground">RECTIFIED</span></div>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2"><span className="font-mono font-bold">{s.snag_number}</span><StatusBadge value={s.severity} /></div>
        <p className="text-sm">{s.defect_description}</p>
        <div className="text-xs text-muted-foreground">{level} · {s.gridline_ref} · {pkg}</div>
        <div className="flex items-center justify-between"><StatusBadge value={s.status} /><span className={`text-xs ${overdue ? "font-bold text-destructive" : "text-muted-foreground"}`}>Rectify by {s.rectify_by_date}</span></div>
        {s._offline && <p className="text-xs text-muted-foreground">{s._offline}</p>}
        {!s._offline && s.status === "Open" && (
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase text-muted-foreground">Upload fixed photo & mark rectified</div>
            <PhotoPicker onChange={(p) => p && update({ photo_rectified_url: p, status: "Fixed - Awaiting Re-inspection" }, `${s.snag_number} marked rectified`)} />
          </div>
        )}
        {!s._offline && <><ItemChat itemType="snag" itemId={s.id} label={s.snag_number} /><DeleteMistake table="snags" row={s} label={s.snag_number} /></>}
        {!s._offline && canVerify && s.status === "Fixed - Awaiting Re-inspection" && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" disabled={busy} onClick={() => update({ status: "Open" }, "Rejected — reopened")}>Reject</Button>
            <Button className="h-11 bg-success text-success-foreground hover:bg-success/90" disabled={busy} onClick={() => update({ status: "Verified & Closed" }, `${s.snag_number} verified & closed`)}><CheckCircle2 className="h-4 w-4" />Verify & Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
