import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RegisterFilter({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-11 w-full min-w-0"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label}</SelectItem>{items.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent>
    </Select>
  );
}