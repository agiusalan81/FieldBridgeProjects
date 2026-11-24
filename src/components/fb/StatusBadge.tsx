import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  red: "bg-destructive text-destructive-foreground",
  amber: "bg-primary text-primary-foreground",
  green: "bg-success text-success-foreground",
  blue: "bg-info text-success-foreground",
  grey: "bg-secondary text-secondary-foreground",
};

const map: Record<string, keyof typeof tone> = {
  Delay: "red", Open: "amber", Draft: "grey", "Under Review": "blue", Answered: "green", Closed: "grey", Overdue: "red",
  "Critical / Life Safety": "red", "Major Defect": "amber", "Minor Cosmetic": "grey",
  "Fixed - Awaiting Re-inspection": "blue", "Verified & Closed": "green",
  Approved: "green", Rejected: "red", "Submitted to PQS / Employer": "blue",
  "on-site": "green", mobilized: "amber", completed: "grey",
  "For Construction": "green", "For Information": "blue", Tender: "grey",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap", tone[map[value] ?? "grey"], className)}>
      {value}
    </span>
  );
}
