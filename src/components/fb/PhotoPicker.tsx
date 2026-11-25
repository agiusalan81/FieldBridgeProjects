import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safePhoto } from "@/lib/photo";

/**
 * Two explicit photo sources: "Take photo" opens the device camera
 * (capture attribute), "Choose from gallery" opens the file picker.
 * A single input with accept="image/*" lets the OS decide, and many
 * phones then only show the gallery — so we keep them separate.
 */
export function PhotoPicker({ value, onChange, max }: { value?: string | undefined; onChange: (dataUrl: string | undefined) => void; max?: number }) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined, input: HTMLInputElement) {
    input.value = "";
    if (!file) return;
    setBusy(true);
    const p = await safePhoto(file, max);
    setBusy(false);
    if (p) onChange(p);
  }

  return (
    <div className="space-y-2">
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0], e.target)} />
      <input ref={galRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0], e.target)} />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Selected photo" className="max-h-40 rounded" />
          <Button type="button" size="icon" variant="destructive" aria-label="Remove photo" className="absolute -right-2 -top-2 h-7 w-7" onClick={() => onChange(undefined)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => camRef.current?.click()}>
            <Camera className="h-4 w-4" />Take photo
          </Button>
          <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => galRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />From gallery
          </Button>
        </div>
      )}
      {busy && <p className="text-xs text-muted-foreground">Reading photo…</p>}
    </div>
  );
}
