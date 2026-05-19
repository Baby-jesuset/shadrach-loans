import { Badge } from "@/components/ui/badge";
import type { LoanStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const map: Record<LoanStatus, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-muted text-foreground border-border" },
  approved:  { label: "Approved",  cls: "bg-primary/10 text-primary border-primary/20" },
  active:    { label: "Active",    cls: "bg-success/15 text-success border-success/25" },
  paid:      { label: "Paid",      cls: "bg-gold/20 text-gold-foreground dark:text-gold border-gold/30" },
  overdue:   { label: "Overdue",   cls: "bg-warning/20 text-warning border-warning/30" },
  defaulted: { label: "Defaulted", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const s = map[status];
  return <Badge variant="outline" className={cn("font-medium capitalize", s.cls)}>{s.label}</Badge>;
}
