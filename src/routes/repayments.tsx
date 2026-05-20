import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Receipt, Printer } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/mock-store";
import { formatCurrency, formatDate, remainingBalance, isOverdue } from "@/lib/loan-utils";
import type { Repayment, PaymentMethod } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/repayments")({ component: RepaymentsPage });

const repaySchema = z.object({
  loanId: z.string().min(1, "Required"),
  amount: z.coerce.number().positive(),
  date: z.string().min(1, "Required"),
  method: z.enum(["cash", "mpesa", "bank", "cheque"]),
  note: z.string().optional(),
});
type RepayForm = z.infer<typeof repaySchema>;

function RepaymentsPage() {
  const { loans, repayments, members, addRepayment } = useStore();
  const [open, setOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");
  const [receipt, setReceipt] = useState<Repayment | null>(null);

  const rows = useMemo(() => {
    return [...repayments]
      .filter((r) => methodFilter === "all" || r.method === methodFilter)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .map((r) => {
        const loan = loans.find((l) => l.id === r.loanId);
        const member = loan ? members.find((m) => m.id === loan.memberId) : undefined;
        const balanceAfter = loan ? remainingBalance(loan, repayments) : 0;
        const late = loan ? isOverdue(loan, repayments) : false;
        return { r, loan, member, balanceAfter, late };
      });
  }, [repayments, loans, members, methodFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Repayments</h2>
          <p className="text-sm text-muted-foreground">Record payments and track outstanding balances.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Record repayment</Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display">Payment history</CardTitle>
            <CardDescription>{rows.length} payment{rows.length === 1 ? "" : "s"}</CardDescription>
          </div>
          <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as PaymentMethod | "all")}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="bank">Bank transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
              <Receipt className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="font-display text-base">No repayments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Record your first repayment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Loan</th>
                    <th className="py-2 pr-3 font-medium">Member</th>
                    <th className="py-2 pr-3 font-medium">Method</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Balance</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ r, loan, member, balanceAfter, late }) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3 text-muted-foreground">{formatDate(r.date)}</td>
                      <td className="py-3 pr-3 font-medium">{loan?.id ?? "—"}</td>
                      <td className="py-3 pr-3">{member?.fullName ?? "—"}</td>
                      <td className="py-3 pr-3 capitalize">{r.method}</td>
                      <td className="py-3 pr-3 font-semibold text-success">{formatCurrency(r.amount)}</td>
                      <td className="py-3 pr-3">{formatCurrency(balanceAfter)}</td>
                      <td className="py-3 pr-3">
                        {late
                          ? <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">Late</Badge>
                          : <Badge variant="outline" className="bg-success/10 text-success border-success/25">On time</Badge>}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <Button size="icon" variant="ghost" onClick={() => setReceipt(r)}><Printer className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <RepayDialog open={open} onOpenChange={setOpen} onSubmit={(data) => {
        const rep = addRepayment(data);
        toast.success("Repayment recorded");
        setOpen(false);
        setReceipt(rep);
      }} />

      <ReceiptDialog repayment={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

function RepayDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (d: RepayForm) => void }) {
  const { loans, members, repayments } = useStore();
  const activeLoans = loans.filter((l) => l.status !== "paid" && l.status !== "pending");
  const form = useForm<RepayForm>({
    resolver: zodResolver(repaySchema),
    defaultValues: { loanId: "", amount: 0, date: new Date().toISOString().slice(0, 10), method: "mpesa", note: "" },
  });
  const loanId = form.watch("loanId");
  const loan = loans.find((l) => l.id === loanId);
  const balance = loan ? remainingBalance(loan, repayments) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Record repayment</DialogTitle>
          <DialogDescription>Updates the loan's remaining balance immediately.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Loan</Label>
            <Select value={form.watch("loanId")} onValueChange={(v) => form.setValue("loanId", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select an active loan" /></SelectTrigger>
              <SelectContent>
                {activeLoans.map((l) => {
                  const m = members.find((x) => x.id === l.memberId);
                  return <SelectItem key={l.id} value={l.id}>{l.id} · {m?.fullName} · {formatCurrency(remainingBalance(l, repayments))} due</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          {loan && (
            <div className="sm:col-span-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
              Outstanding balance: <span className="font-semibold">{formatCurrency(balance)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount (KES)</Label>
            <Input type="number" {...form.register("amount")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" {...form.register("date")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Method</Label>
            <Select value={form.watch("method")} onValueChange={(v) => form.setValue("method", v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
            <Input {...form.register("note")} />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Record payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDialog({ repayment, onClose }: { repayment: Repayment | null; onClose: () => void }) {
  const { loans, members, repayments } = useStore();
  if (!repayment) return null;
  const loan = loans.find((l) => l.id === repayment.loanId);
  const member = loan ? members.find((m) => m.id === loan.memberId) : undefined;
  const balance = loan ? remainingBalance(loan, repayments) : 0;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Payment receipt</DialogTitle>
          <DialogDescription>Reference: {repayment.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 rounded-md border border-dashed border-border p-4 text-sm">
          <Row k="Date" v={formatDate(repayment.date)} />
          <Row k="Loan" v={loan?.id ?? "—"} />
          <Row k="Member" v={member?.fullName ?? "—"} />
          <Row k="Method" v={<span className="capitalize">{repayment.method}</span>} />
          <Row k="Amount paid" v={<span className="font-semibold text-success">{formatCurrency(repayment.amount)}</span>} />
          <Row k="Remaining balance" v={formatCurrency(balance)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />Print</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
