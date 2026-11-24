import { useRef } from "react";
import { Button } from "@/components/ui/button";

/** Finger/stylus signature pad. Calls onChange with a PNG data URL (or null when cleared). */
export function SignaturePad({ onChange }: { onChange: (url: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!; const r = c.getBoundingClientRect();
    return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)] as const;
  };
  return (
    <div>
      <canvas ref={ref} width={600} height={200} aria-label="Signature pad"
        className="h-36 w-full touch-none rounded-md border-2 border-dashed border-border bg-background"
        onPointerDown={(e) => { drawing.current = true; const ctx = ref.current!.getContext("2d")!; const [x, y] = pos(e); ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); }}
        onPointerMove={(e) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); }}
        onPointerUp={() => { drawing.current = false; onChange(ref.current!.toDataURL("image/png")); }} />
      <Button type="button" variant="ghost" size="sm" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); onChange(null); }}>Clear</Button>
    </div>
  );
}
