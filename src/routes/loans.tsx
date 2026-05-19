import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Eye, CheckCircle2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/mock-store";
import {
  buildSchedule, computedStatus, formatCurrency, formatDate, monthlyInstallment,
  paidAmount, remainingBalance, totalRepayable,
} from "@/lib/loan-utils";
import { LoanStatusBadge } from "@/components/loan-status-badge";
import type { Loan, LoanStatus } from "@/lib/types";

export const Route = createFileRoute("/loans")({ component: LoansPage });

const loanSchema = z.object({
  memberId: z.string().min(1, "Select a member"),
  amount: z.coerce.number().positive("Amount must be > 0"),
  interestRate: z.coerce.number().min(0).max(100),
  durationMonths: z.coerce.number().int().min(1).max(120),
  purpose: z.string().min(2, "Required"),
  issueDate: z.string().min(1, "Required"),
});
type LoanForm = z.infer<typeof loanSchema>;

function LoansPage() {
  const { members, loans, repayments, addLoan, updateLoan } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<Loan | null>(null);

  const enriched = useMemo(() => loans.map((l) => ({
    loan: l,
    status: computedStatus(l, repayments),
    balance: remainingBalance(l, repayments),
    member: members.find((m) => m.id === l.memberId),
  })), [loans, repayments, members]);

  const filtered = enriched.filter(({ loan, member, status }) => {
    const q = query.toLowerCase();
    const matchQ = !q || loan.id.toLowerCase().includes(q) || (member?.fullName ?? "").toLowerCase().includes(q) || loan.purpose.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Loans</h2>
          <p className="text-sm text-muted-foreground">Issue, approve and track every loan in your portfolio.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />New loan</Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display">Loan portfolio</CardTitle>
            <CardDescription>{filtered.length} loan{filtered.length === 1 ? "" : "s"} shown</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as LoanStatus | "all")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search loans…" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
              <p className="font-display text-base">No loans match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or create a new loan.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Loan ID</th>
                  <th className="py-2 pr-3 font-medium">Member</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Installment</th>
                  <th className="py-2 pr-3 font-medium">Balance</th>
                  <th className="py-2 pr-3 font-medium">Due</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ loan, member, status, balance }) => (
                  <tr key={loan.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3 font-medium">{loan.id}</td>
                    <td className="py-3 pr-3">{member?.fullName ?? "—"}</td>
                    <td className="py-3 pr-3">{formatCurrency(loan.amount)}</td>
                    <td className="py-3 pr-3">{formatCurrency(monthlyInstallment(loan))}</td>
                    <td className="py-3 pr-3">{formatCurrency(balance)}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{formatDate(loan.dueDate)}</td>
                    <td className="py-3 pr-3"><LoanStatusBadge status={status} /></td>
                    <td className="py-3 pr-3">
                      <div className="flex justify-end gap-1">
                        {loan.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="text-success hover:text-success" onClick={() => { updateLoan(loan.id, { status: "active" }); toast.success(`${loan.id} approved`); }}>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { updateLoan(loan.id, { status: "defaulted" }); toast("Loan rejected"); }}>
                              <XCircle className="mr-1 h-3.5 w-3.5" />Reject
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setDetails(loan)}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      <LoanDialog open={open} onOpenChange={setOpen} onSubmit={(data) => {
        const issue = new Date(data.issueDate);
        const due = new Date(issue);
        due.setMonth(due.getMonth() + data.durationMonths);
        addLoan({ ...data, dueDate: due.toISOString() });
        toast.success("Loan application created");
        setOpen(false);
      }} />

      <LoanDetailsDialog loan={details} onClose={() => setDetails(null)} />
    </div>
  );
}

function LoanDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (d: LoanForm & { issueDate: string }) => void }) {
  const { members } = useStore();
  const form = useForm<LoanForm>({
    resolver: zodResolver(loanSchema),
    defaultValues: { memberId: "", amount: 50000, interestRate: 12, durationMonths: 12, purpose: "", issueDate: new Date().toISOString().slice(0, 10) },
  });

  const amount = form.watch("amount") || 0;
  const rate = form.watch("interestRate") || 0;
  const months = form.watch("durationMonths") || 1;
  const repayable = totalRepayable({ amount, interestRate: rate, durationMonths: months });
  const installment = repayable / Math.max(1, months);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">New loan application</DialogTitle>
          <DialogDescription>Interest is computed using simple interest for SACCO clarity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Member" error={form.formState.errors.memberId?.message} className="sm:col-span-2">
            <Select value={form.watch("memberId")} onValueChange={(v) => form.setValue("memberId", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.fullName} · {m.phone}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Amount (KES)" error={form.formState.errors.amount?.message}>
            <Input type="number" {...form.register("amount")} />
          </Field>
          <Field label="Interest rate (annual %)" error={form.formState.errors.interestRate?.message}>
            <Input type="number" step="0.1" {...form.register("interestRate")} />
          </Field>
          <Field label="Duration (months)" error={form.formState.errors.durationMonths?.message}>
            <Input type="number" {...form.register("durationMonths")} />
          </Field>
          <Field label="Issue date" error={form.formState.errors.issueDate?.message}>
            <Input type="date" {...form.register("issueDate")} />
          </Field>
          <Field label="Purpose" error={form.formState.errors.purpose?.message} className="sm:col-span-2">
            <Textarea rows={3} {...form.register("purpose")} placeholder="What is this loan for?" />
          </Field>

          <div className="sm:col-span-2 rounded-lg border border-border bg-muted/40 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Summary label="Total repayable" value={formatCurrency(repayable)} />
              <Summary label="Monthly installment" value={formatCurrency(installment)} />
              <Summary label="Total interest" value={formatCurrency(repayable - amount)} />
            </div>
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create application</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoanDetailsDialog({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const { members, repayments } = useStore();
  if (!loan) return null;
  const member = members.find((m) => m.id === loan.memberId);
  const schedule = buildSchedule(loan, repayments);
  const balance = remainingBalance(loan, repayments);
  const paid = paidAmount(loan.id, repayments);

  return (
    <Dialog open={!!loan} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {loan.id}
            <LoanStatusBadge status={computedStatus(loan, repayments)} />
          </DialogTitle>
          <DialogDescription>{member?.fullName} · {loan.purpose}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Summary label="Principal" value={formatCurrency(loan.amount)} />
          <Summary label="Interest rate" value={`${loan.interestRate}% p.a.`} />
          <Summary label="Duration" value={`${loan.durationMonths} mo`} />
          <Summary label="Installment" value={formatCurrency(monthlyInstallment(loan))} />
          <Summary label="Total repayable" value={formatCurrency(totalRepayable(loan))} />
          <Summary label="Paid to date" value={formatCurrency(paid)} />
          <Summary label="Balance" value={formatCurrency(balance)} />
          <Summary label="Due date" value={formatDate(loan.dueDate)} />
        </div>

        <div>
          <h3 className="mb-2 mt-4 font-display text-sm font-semibold">Repayment schedule</h3>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Due date</th>
                  <th className="px-3 py-2 font-medium">Expected</th>
                  <th className="px-3 py-2 font-medium">Cumulative</th>
                  <th className="px-3 py-2 font-medium">Paid by then</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((r) => (
                  <tr key={r.n} className="border-t border-border/60">
                    <td className="px-3 py-2">{r.n}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(r.dueDate)}</td>
                    <td className="px-3 py-2">{formatCurrency(r.expected)}</td>
                    <td className="px-3 py-2">{formatCurrency(r.cumulativeExpected)}</td>
                    <td className="px-3 py-2">{formatCurrency(r.paidByThen)}</td>
                    <td className="px-3 py-2 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-left">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-sm font-semibold">{value}</div>
    </div>
  );
}
