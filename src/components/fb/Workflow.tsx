import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { db, PROJECT_ID, useRefresh, type Row } from "@/lib/db";
import { canDelete, nextNumber, OWNER_EMAIL } from "@/lib/workflow";
import { PhotoPicker } from "./PhotoPicker";

export function useMe() {
  const [me, setMe] = useState<{ id?: string | undefined; email?: string | undefined; isOwner: boolean }>({ isOwner: false });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe({ id: data.user?.id, email: data.user?.email, isOwner: data.user?.email === OWNER_EMAIL }));
  }, []);
  return me;
}

/** "Delete (logged in error)" — only shown to the creator while the record is still open. */
export function DeleteMistake({ table, row, label, onDone }: { table: string; row: Row; label: string; onDone?: () => void }) {
  const me = useMe();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  if (!canDelete(row, me)) return null;
  async function del() {
    const { error } = await db.from(table).delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${label} deleted`); refresh(table); onDone?.();
  }
  return (<>
    <Button variant="outline" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); setOpen(true); }}><Trash2 className="h-4 w-4" />Delete (logged in error)</Button>
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>Only use this if it was logged by mistake. Genuine items must be resolved with photo evidence instead.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del}>Delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}

/** Photo + note evidence capture used to formally resolve an item. */
export function ResolveWithPhoto({ onResolve, cta = "Resolve with photo evidence" }: { onResolve: (photo: string, note: string) => Promise<void>; cta?: string }) {
  const [photo, setPhoto] = useState<string>();
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2 rounded-md border-2 border-success p-3">
      <div className="text-xs font-bold uppercase">Formal resolution</div>
      <PhotoPicker value={photo} onChange={setPhoto} />
      <Textarea placeholder="What was done to resolve it?" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button className="w-full" disabled={!photo || !note.trim()} onClick={() => photo && onResolve(photo, note)}>{cta}</Button>
      {!photo && <p className="text-xs text-muted-foreground">A photo is required to resolve.</p>}
    </div>
  );
}

/** Push a site event (RFI / daywork) into the commercial funnel as a Potential variation. */
export function ToVariation({ source, sourceId, title, scope, amount, eot, linkTable, disabled }: { source: "rfi" | "daywork"; sourceId: string; title: string; scope?: string; amount?: number; eot?: number; linkTable: string; disabled?: boolean }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const { data: existing } = await db.from("variations").select("variation_number");
    const number = nextNumber("VO", (existing ?? []).map((v: Row) => v.variation_number));
    const { data, error } = await db.from("variations").insert({
      project_id: PROJECT_ID, variation_number: number, title, scope_description: scope ?? null,
      instruction_source: source === "rfi" ? "RFI response" : "Signed daywork sheet", source_type: source, source_id: sourceId,
      claimed_contractor_amount: amount ?? null, eot_days_claimed: eot ?? null, status: "Potential",
    }).select("id").single();
    if (!error) await db.from(linkTable).update({ variation_id: data.id }).eq("id", sourceId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${number} raised in Commercials`); refresh("variations", linkTable);
  }
  return <Button variant="outline" size="sm" disabled={disabled || busy} onClick={go}><ArrowRightLeft className="h-4 w-4" />{disabled ? "Variation raised" : "Convert to variation"}</Button>;
}
