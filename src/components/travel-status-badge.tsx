import type { TravelStatus } from "@/lib/types";
import { TRAVEL_STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const tone: Record<TravelStatus, string> = {
  processing: "bg-muted text-muted-foreground border-border",
  approved: "bg-primary/15 text-primary border-primary/25",
  awaiting_travel: "bg-gold/15 text-gold-foreground dark:text-gold border-gold/30",
  travelled: "bg-success/15 text-success border-success/25",
  returned: "bg-secondary text-secondary-foreground border-border",
  contract_completed: "bg-success/25 text-success border-success/30",
};

export function TravelStatusBadge({ status, className }: { status: TravelStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tone[status], className)}>
      {TRAVEL_STATUS_LABEL[status]}
    </span>
  );
}
