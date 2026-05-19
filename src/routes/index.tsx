import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Users, Banknote, CheckCircle2, AlertTriangle, Coins, Receipt, ArrowUpRight, Plus,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { LoanStatusBadge } from "@/components/loan-status-badge";
import { useStore } from "@/lib/mock-store";
import { computedStatus, formatCurrency, formatDate, remainingBalance, totalRepayable } from "@/lib/loan-utils";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { members, loans, repayments } = useStore();

  const stats = useMemo(() => {
    const statuses = loans.map((l) => computedStatus(l, repayments));
    const issued = loans.reduce((s, l) => s + l.amount, 0);
    const collected = repayments.reduce((s, r) => s + r.amount, 0);
    return {
      members: members.length,
      issued,
      active: statuses.filter((s) => s === "active").length,
      paid: statuses.filter((s) => s === "paid").length,
      overdue: statuses.filter((s) => s === "overdue").length,
      collected,
    };
  }, [members, loans, repayments]);

  // Monthly trend (last 6 months)
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
      const k = idx(new Date(l.issueDate));
      const m = months.find((x) => x.key === k);
      if (m) m.disbursed += l.amount;
    });
    repayments.forEach((r) => {
      const k = idx(new Date(r.date));
      const m = months.find((x) => x.key === k);
      if (m) m.collected += r.amount;
    });
    return months;
  }, [loans, repayments]);

  const portfolio = useMemo(() => {
    const groups: Record<string, number> = { active: 0, paid: 0, overdue: 0, pending: 0, approved: 0, defaulted: 0 };
    loans.forEach((l) => { groups[computedStatus(l, repayments)] += 1; });
    return Object.entries(groups)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [loans, repayments]);

  const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

  const recent = [...loans].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero / actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">A snapshot of your SACCO's loan portfolio today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/members">Add member</Link></Button>
          <Button asChild><Link to="/loans"><Plus className="mr-1.5 h-4 w-4" />New loan</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total members" value={String(stats.members)} icon={Users} />
        <StatCard label="Total loans issued" value={formatCurrency(stats.issued)} icon={Banknote} tone="gold" hint={`${loans.length} loans on record`} />
        <StatCard label="Repayments collected" value={formatCurrency(stats.collected)} icon={Coins} tone="success" />
        <StatCard label="Active loans" value={String(stats.active)} icon={Receipt} />
        <StatCard label="Fully paid" value={String(stats.paid)} icon={CheckCircle2} tone="success" />
        <StatCard label="Overdue" value={String(stats.overdue)} icon={AlertTriangle} tone="warning" />
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
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Portfolio mix</CardTitle>
            <CardDescription>Loans by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={portfolio} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {portfolio.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display">Recent loan applications</CardTitle>
            <CardDescription>Latest 5 entries from your portfolio</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm"><Link to="/loans">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Loan</th>
                  <th className="py-2 pr-3 font-medium">Member</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Balance</th>
                  <th className="py-2 pr-3 font-medium">Due</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l) => {
                  const member = members.find((m) => m.id === l.memberId);
                  return (
                    <tr key={l.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3 font-medium">{l.id}</td>
                      <td className="py-3 pr-3">{member?.fullName ?? "—"}</td>
                      <td className="py-3 pr-3">{formatCurrency(l.amount)}</td>
                      <td className="py-3 pr-3">{formatCurrency(remainingBalance(l, repayments))}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{formatDate(l.dueDate)}</td>
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
