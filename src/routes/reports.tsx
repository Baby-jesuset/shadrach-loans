import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, FileSpreadsheet, FileText, Plane } from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStore } from "@/lib/mock-store";
import { computedStatus, formatCurrency, formatDate, remainingBalance } from "@/lib/loan-utils";
import { LoanStatusBadge } from "@/components/loan-status-badge";
import { TravelStatusBadge } from "@/components/travel-status-badge";
import { CountryBadge } from "@/components/country-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const { loans, repayments, members } = useStore();

  const monthly = useMemo(() => {
    const months: { key: string; label: string; collected: number; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short" }), collected: 0, count: 0 });
    }
    repayments.forEach((r) => {
      const d = new Date(r.date);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) { m.collected += r.amount; m.count += 1; }
    });
    return months;
  }, [repayments]);

  const overdue = loans
    .map((l) => ({ l, status: computedStatus(l, repayments), bal: remainingBalance(l, repayments) }))
    .filter((x) => x.status === "overdue");

  const destinationCounts = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach((m) => {
      const c = m.employment?.destinationCountry;
      if (c) map.set(c, (map.get(c) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
  }, [members]);

  const travelled = useMemo(() =>
    members.filter((m) => m.travelStatus === "travelled" || m.travelStatus === "returned" || m.travelStatus === "contract_completed"),
  [members]);

  const exportToast = (kind: string) => toast.success(`${kind} export prepared (demo)`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Travel, destinations and loan performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToast("PDF")}><FileText className="mr-1.5 h-4 w-4" />Export PDF</Button>
          <Button onClick={() => exportToast("Excel")}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Export Excel</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Monthly repayments</CardTitle>
            <CardDescription>Collections over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="collected" name="Collected" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Summary</CardTitle>
            <CardDescription>Live totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow k="Total applicants" v={String(members.length)} />
            <SummaryRow k="Workers travelled" v={String(travelled.length)} />
            <SummaryRow k="Total loans" v={String(loans.length)} />
            <SummaryRow k="Portfolio outstanding" v={formatCurrency(loans.reduce((s, l) => s + remainingBalance(l, repayments), 0))} />
            <SummaryRow k="Collected (all time)" v={formatCurrency(repayments.reduce((s, r) => s + r.amount, 0))} />
            <SummaryRow k="Overdue loans" v={String(overdue.length)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display">Workers by destination country</CardTitle>
            <CardDescription>{destinationCounts.length} countries covered</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToast("Destinations report")}><Download className="mr-1.5 h-4 w-4" />Export</Button>
        </CardHeader>
        <CardContent>
          {destinationCounts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              No destination data yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {destinationCounts.map((d) => (
                <div key={d.country} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <CountryBadge country={d.country} />
                  <span className="font-display text-lg font-semibold">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display flex items-center gap-2"><Plane className="h-4 w-4" />Travelled workers</CardTitle>
            <CardDescription>{travelled.length} worker{travelled.length === 1 ? "" : "s"} departed or completed</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToast("Travelled workers")}><Download className="mr-1.5 h-4 w-4" />Export</Button>
        </CardHeader>
        <CardContent>
          {travelled.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              No travelled workers on record yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Worker</th>
                    <th className="py-2 pr-3 font-medium">Destination</th>
                    <th className="py-2 pr-3 font-medium">Employer</th>
                    <th className="py-2 pr-3 font-medium">Travel date</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {travelled.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3 font-medium">{m.fullName}</td>
                      <td className="py-3 pr-3"><CountryBadge country={m.employment?.destinationCountry} /></td>
                      <td className="py-3 pr-3">{m.employment?.employer ?? "—"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{m.employment?.travelDate ? formatDate(m.employment.travelDate) : "—"}</td>
                      <td className="py-3 pr-3"><TravelStatusBadge status={m.travelStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display">Overdue loans report</CardTitle>
            <CardDescription>{overdue.length} loan{overdue.length === 1 ? "" : "s"} past due</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToast("Overdue report")}><Download className="mr-1.5 h-4 w-4" />Export</Button>
        </CardHeader>
        <CardContent>
          {overdue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
              <p className="font-display text-base">No overdue loans 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">Your portfolio is healthy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Loan</th>
                    <th className="py-2 pr-3 font-medium">Applicant</th>
                    <th className="py-2 pr-3 font-medium">Principal</th>
                    <th className="py-2 pr-3 font-medium">Balance</th>
                    <th className="py-2 pr-3 font-medium">Due since</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map(({ l, status, bal }) => {
                    const member = members.find((m) => m.id === l.memberId);
                    return (
                      <tr key={l.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-3 font-medium">{l.id}</td>
                        <td className="py-3 pr-3">{member?.fullName ?? "—"}</td>
                        <td className="py-3 pr-3">{formatCurrency(l.amount)}</td>
                        <td className="py-3 pr-3 text-warning">{formatCurrency(bal)}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{formatDate(l.dueDate)}</td>
                        <td className="py-3 pr-3"><LoanStatusBadge status={status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-display font-semibold">{v}</span>
    </div>
  );
}
