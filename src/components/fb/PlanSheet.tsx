// Procedural vector "drawing sheet" so each register sheet has a believable plan.
export function PlanSheet({ seed, showChanges }: { seed: string; showChanges?: boolean }) {
  const cols = ["A", "B", "C", "D", "E", "F"];
  const rows = [1, 2, 3, 4, 5, 6];
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <svg viewBox="0 0 1000 700" className="h-full w-full select-none bg-plan-bg text-plan-line" preserveAspectRatio="xMidYMid meet">
      <rect x="40" y="40" width="920" height="620" fill="none" stroke="currentColor" strokeWidth="3" />
      {cols.map((c, i) => { const x = 100 + i * 160; return (
        <g key={c}><line x1={x} y1="60" x2={x} y2="640" stroke="currentColor" strokeDasharray="12 6" strokeWidth="0.8" opacity="0.5" />
          <circle cx={x} cy="58" r="14" fill="none" stroke="currentColor" /><text x={x} y="63" textAnchor="middle" fontSize="14" fill="currentColor">{c}</text></g>); })}
      {rows.map((r, i) => { const y = 100 + i * 100; return (
        <g key={r}><line x1="60" y1={y} x2="940" y2={y} stroke="currentColor" strokeDasharray="12 6" strokeWidth="0.8" opacity="0.5" />
          <circle cx="58" cy={y} r="14" fill="none" stroke="currentColor" /><text x="58" y={y + 5} textAnchor="middle" fontSize="14" fill="currentColor">{r}</text></g>); })}
      {cols.flatMap((_, i) => rows.map((_, j) => <rect key={`${i}-${j}`} x={92 + i * 160} y={92 + j * 100} width="16" height="16" fill="currentColor" />))}
      <rect x={420} y={180} width={140} height={220} fill="none" stroke="currentColor" strokeWidth="4" />
      <text x="490" y="295" textAnchor="middle" fontSize="16" fill="currentColor">CORE 1 · LIFTS</text>
      <path d={`M100 ${300 + (h % 3) * 50} H420 M560 ${250 + (h % 4) * 40} H900 M260 100 V600 M740 100 V${450 + (h % 2) * 100}`} stroke="currentColor" strokeWidth="2.5" fill="none" />
      {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={120 + ((h * (i + 3)) % 640)} y={420 + (i % 2) * 90} width="110" height="70" fill="none" stroke="currentColor" strokeWidth="1.5" />)}
      {showChanges && (
        <g className="text-destructive" stroke="currentColor" fill="none" strokeWidth="3">
          <path d="M600 420 q20 -25 40 0 q20 -25 40 0 q20 -25 40 0 q25 20 0 40 q20 25 -40 25 q-20 25 -40 0 q-20 25 -40 0 q-25 -20 0 -40 z" />
          <path d="M160 180 q20 -25 40 0 q20 -25 40 0 q25 20 0 40 q-20 25 -40 0 q-20 25 -40 0 q-25 -20 0 -40 z" />
          <text x="740" y="420" fontSize="20" fill="currentColor" stroke="none">△ Rev change</text>
        </g>
      )}
      <g transform="translate(700 600)"><rect width="260" height="60" fill="none" stroke="currentColor" strokeWidth="2" /><text x="10" y="25" fontSize="14" fill="currentColor">FIELDBRIDGE · PRJ-2026-01</text><text x="10" y="48" fontSize="18" fontWeight="bold" fill="currentColor">{seed}</text></g>
    </svg>
  );
}
