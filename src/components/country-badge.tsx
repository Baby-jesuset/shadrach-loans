import { cn } from "@/lib/utils";

const flag = (country: string) => {
  const map: Record<string, string> = {
    "Saudi Arabia": "🇸🇦",
    "United Arab Emirates": "🇦🇪",
    Qatar: "🇶🇦",
    Kuwait: "🇰🇼",
    Oman: "🇴🇲",
    Bahrain: "🇧🇭",
    Jordan: "🇯🇴",
    Lebanon: "🇱🇧",
  };
  return map[country] ?? "🌍";
};

export function CountryBadge({ country, className }: { country?: string; className?: string }) {
  if (!country) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium", className)}>
      <span aria-hidden>{flag(country)}</span>
      <span>{country}</span>
    </span>
  );
}
