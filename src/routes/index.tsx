import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  UserSquare2, Banknote, CheckCircle2, AlertTriangle, Coins, Plane, ArrowUpRight, Plus, Globe2, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { LoanStatusBadge } from "@/components/loan-status-badge";
import { TravelStatusBadge } from "@/components/travel-status-badge";
import { CountryBadge } from "@/components/country-badge";
import { useStore } from "@/lib/mock-store";
import { computedStatus, formatCurrency, formatDate, remainingBalance } from "@/lib/loan-utils";
import { TRAVEL_STATUS_LABEL, type TravelStatus } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { members, loans, repayments } = useStore();

  const stats = useMemo(() => {
    const statuses = loans.map((l) => computedStatus(l, repayments));
    const issued = loans.reduce((s, l) => s + l.amount, 0);
    const collected = repayments.reduce((s, r) => s + r.amount, 0);
    const abroad = members.filter((m) => m.travelStatus === "travelled").length;
    const pending = members.filter((m) => m.travelStatus === "approved" || m.travelStatus === "awaiting_travel").length;
    return {
      applicants: members.length,
      issued,
      active: statuses.filter((s) => s === "active").length,
      overdue: statuses.filter((s) => s === "overdue").length,
      collected,
      abroad,
      pending,
    };
  }, [members, loans, repayments]);

  const trend = useMemo(() => {
    const months: { key: string; label: string; disbursed: number; collected: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({ key, label: d.toLocaleDateString("en-GB", { month: "short" }), disbursed: 0, collected: 0 });
    }
    const idx = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
    loans.forEach((l) => {
      const m = months.find((x) => x.key === idx(new Date(l.issueDate)));
      if (m) m.disbursed += l.amount;
    });
    repayments.forEach((r) => {
      const m = months.find((x) => x.key === idx(new Date(r.date)));
      if (m) m.collected += r.amount;
    });
    return months;
  }, [loans, repayments]);

  const travelDistribution = useMemo(() => {
    const groups = members.reduce<Record<TravelStatus, number>>((acc, m) => {
      acc[m.travelStatus] = (acc[m.travelStatus] ?? 0) + 1;
      return acc;
    }, { processing: 0, approved: 0, awaiting_travel: 0, travelled: 0, returned: 0, contract_completed: 0 });
    return Object.entries(groups)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: TRAVEL_STATUS_LABEL[k as TravelStatus], value: v }));
  }, [members]);

  const destinations = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach((m) => {
      const c = m.employment?.destinationCountry;
      if (c) map.set(c, (map.get(c) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
  }, [members]);

  const pendingDepartures = useMemo(() =>
    members
      .filter((m) => m.travelStatus === "awaiting_travel" || m.travelStatus === "approved")
      .sort((a, b) => +new Date(a.employment?.travelDate ?? "9999") - +new Date(b.employment?.travelDate ?? "9999"))
      .slice(0, 5),
  [members]);

  const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">A snapshot of your migration loan portfolio and workers abroad.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/members">Register applicant</Link></Button>
          <Button asChild><Link to="/loans"><Plus className="mr-1.5 h-4 w-4" />New loan</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applicants" value={String(stats.applicants)} icon={UserSquare2} />
        <StatCard label="Workers abroad" value={String(stats.abroad)} icon={Plane} tone="success" />
        <StatCard label="Pending departures" value={String(stats.pending)} icon={Clock} tone="gold" />
        <StatCard label="Loans disbursed" value={formatCurrency(stats.issued)} icon={Banknote} hint={`${loans.length} loans on record`} />
        <StatCard label="Repayments collected" value={formatCurrency(stats.collected)} icon={Coins} tone="success" />
        <StatCard label="Active loans" value={String(stats.active)} icon={CheckCircle2} />
        <StatCard label="Overdue" value={String(stats.overdue)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Destinations" value={String(destinations.length)} icon={Globe2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Disbursements vs. Collections</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Travel status</CardTitle>
            <CardDescription>Distribution across applicants</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={travelDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {travelDistribution.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Workers by destination</CardTitle>
            <CardDescription>Across all applicants</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinations} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="country" stroke="var(--muted-foreground)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" name="Workers" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Pending departures</CardTitle>
            <CardDescription>Next workers to travel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDepartures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending departures.</p>
            ) : pendingDepartures.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.fullName}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <CountryBadge country={m.employment?.destinationCountry} />
                    <TravelStatusBadge status={m.travelStatus} />
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                  {m.employment?.travelDate ? formatDate(m.employment.travelDate) : "—"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display">Recent loan applications</CardTitle>
            <CardDescription>Latest 5 entries</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm"><Link to="/loans">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Loan</th>
                  <th className="py-2 pr-3 font-medium">Applicant</th>
                  <th className="py-2 pr-3 font-medium">Destination</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Balance</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...loans].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5).map((l) => {
                  const member = members.find((m) => m.id === l.memberId);
                  return (
                    <tr key={l.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3 font-medium">{l.id}</td>
                      <td className="py-3 pr-3">{member?.fullName ?? "—"}</td>
                      <td className="py-3 pr-3"><CountryBadge country={member?.employment?.destinationCountry} /></td>
                      <td className="py-3 pr-3">{formatCurrency(l.amount)}</td>
                      <td className="py-3 pr-3">{formatCurrency(remainingBalance(l, repayments))}</td>
                      <td className="py-3 pr-3"><LoanStatusBadge status={computedStatus(l, repayments)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
