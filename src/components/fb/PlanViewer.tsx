import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Minimize, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doubleTap, pinchStep, zoomAt, type View } from "@/lib/zoom";
import { useBackClose } from "@/hooks/use-back-close";

const FIT: View = { x: 0, y: 0, z: 1 };

/**
 * Document-style plan viewer: pinch / two-finger drag to zoom and move, one finger scrolls the page,
 * double-tap to zoom, mouse wheel + drag on desktop. Full screen lets one finger move the plan too.
 */
export function PlanViewer({ children, resetKey, panEnabled, toolbar, cursor }: { children: ReactNode; resetKey: string; panEnabled: boolean; toolbar?: ReactNode; cursor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<View>(FIT);
  const [full, setFull] = useState(false);
  const fullRef = useRef(full); fullRef.current = full;
  const panRef = useRef(panEnabled); panRef.current = panEnabled;
  const moved = useRef(false);
  useBackClose(full, () => setFull(false));
  useEffect(() => setV(FIT), [resetKey, full]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const local = (x: number, y: number) => { const r = el.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    const metrics = (e: TouchEvent) => {
      const a = e.touches[0]!, b = e.touches[1]!;
      const c = local((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, cx: c.x, cy: c.y };
    };
    let g: ReturnType<typeof metrics> | null = null;
    let one: { x: number; y: number; sx: number; sy: number } | null = null;
    let lastTap = { t: 0, x: 0, y: 0 };
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) { e.preventDefault(); g = metrics(e); one = null; moved.current = true; }
      else if (e.touches.length === 1) { const t = e.touches[0]!; moved.current = false; one = { x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY }; }
    };
    const move = (e: TouchEvent) => {
      if (e.touches.length === 2 && g) { e.preventDefault(); const m = metrics(e); const p = g; setV((cur) => pinchStep(cur, p, m)); g = m; return; }
      const t = e.touches[0];
      if (!t || !one) return;
      if (Math.hypot(t.clientX - one.sx, t.clientY - one.sy) > 8) moved.current = true;
      if (fullRef.current) {
        e.preventDefault();
        const dx = t.clientX - one.x, dy = t.clientY - one.y;
        setV((cur) => (cur.z > 1 ? { ...cur, x: cur.x + dx, y: cur.y + dy } : cur));
        one = { ...one, x: t.clientX, y: t.clientY };
      }
    };
    const end = (e: TouchEvent) => {
      if (e.touches.length < 2) g = null;
      if (e.touches.length > 0) return;
      const t = e.changedTouches[0];
      if (t && !moved.current && panRef.current) {
        const now = Date.now();
        if (now - lastTap.t < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
          e.preventDefault(); const p = local(t.clientX, t.clientY); setV((cur) => doubleTap(cur, p.x, p.y)); lastTap = { t: 0, x: 0, y: 0 };
        } else lastTap = { t: now, x: t.clientX, y: t.clientY };
      }
      one = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const p = local(e.clientX, e.clientY);
      setV((cur) => zoomAt(cur, cur.z * Math.exp(-dy * 0.0015), p.x, p.y));
    };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: false });
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end); el.removeEventListener("wheel", wheel); };
  }, [full]);

  const drag = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className={full ? "fixed inset-0 z-50 flex flex-col bg-background" : "relative"}>
      {full && toolbar && <div className="flex flex-wrap items-center gap-1.5 border-b bg-card p-2">{toolbar}</div>}
      <div ref={ref}
        className={`relative overflow-hidden bg-muted ${full ? "flex-1" : "h-[60vh] rounded-md border-2 border-shell"}`}
        style={{ touchAction: full ? "none" : "pan-y", cursor }}
        onPointerDown={(e) => { if (e.pointerType !== "mouse") return; moved.current = false; drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || !drag.current || !e.buttons || !panEnabled) return;
          const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
          drag.current = { x: e.clientX, y: e.clientY };
          setV((cur) => (cur.z > 1 ? { ...cur, x: cur.x + dx, y: cur.y + dy } : cur));
        }}
        onPointerUp={() => { drag.current = null; }}
        onDoubleClick={(e) => { if (!panEnabled) return; const r = e.currentTarget.getBoundingClientRect(); setV((cur) => doubleTap(cur, e.clientX - r.left, e.clientY - r.top)); }}
        onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); moved.current = false; } }}>
        <div className="absolute inset-0" style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.z})`, transformOrigin: "0 0" }}>{children}</div>
        <div className="absolute bottom-2 left-2 rounded bg-shell px-2 py-1 font-mono text-xs text-shell-foreground">{Math.round(v.z * 100)}%</div>
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setV(FIT); }}><Scan className="h-4 w-4" />Fit</Button>
          <Button size="sm" variant="secondary" aria-label={full ? "Exit full screen" : "Full screen"} onClick={(e) => { e.stopPropagation(); setFull((f) => !f); }}>
            {full ? <><Minimize className="h-4 w-4" />Close</> : <><Maximize className="h-4 w-4" />Full screen</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
