import type { Loan, LoanStatus, Repayment } from "./types";

export function formatCurrency(n: number, currency = "UGX") {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Simple-interest total. */
export function totalRepayable(loan: Pick<Loan, "amount" | "interestRate" | "durationMonths">) {
  const interest = (loan.amount * loan.interestRate * loan.durationMonths) / (100 * 12);
  return loan.amount + interest;
}

export function monthlyInstallment(loan: Pick<Loan, "amount" | "interestRate" | "durationMonths">) {
  return totalRepayable(loan) / Math.max(1, loan.durationMonths);
}

export function paidAmount(loanId: string, repayments: Repayment[]) {
  return repayments.filter((r) => r.loanId === loanId).reduce((s, r) => s + r.amount, 0);
}

export function remainingBalance(loan: Loan, repayments: Repayment[]) {
  return Math.max(0, totalRepayable(loan) - paidAmount(loan.id, repayments));
}

export function isOverdue(loan: Loan, repayments: Repayment[]) {
  if (loan.status === "paid" || loan.status === "pending") return false;
  const balance = remainingBalance(loan, repayments);
  return balance > 0 && new Date(loan.dueDate).getTime() < Date.now();
}

export function computedStatus(loan: Loan, repayments: Repayment[]): LoanStatus {
  if (loan.status === "pending") return "pending";
  if (loan.status === "approved") return "approved";
  if (loan.status === "defaulted") return "defaulted";
  const balance = remainingBalance(loan, repayments);
  if (balance <= 0) return "paid";
  if (new Date(loan.dueDate).getTime() < Date.now()) return "overdue";
  return "active";
}

export function buildSchedule(loan: Loan, repayments: Repayment[]) {
  const installment = monthlyInstallment(loan);
  const issue = new Date(loan.issueDate);
  const rows: Array<{
    n: number;
    dueDate: string;
    expected: number;
    cumulativeExpected: number;
    paidByThen: number;
    status: "paid" | "partial" | "due" | "upcoming" | "overdue";
  }> = [];
  let cum = 0;
  for (let i = 1; i <= loan.durationMonths; i++) {
    const d = new Date(issue);
    d.setMonth(d.getMonth() + i);
    cum += installment;
    const totalPaidByThen = repayments
      .filter((r) => r.loanId === loan.id && new Date(r.date) <= d)
      .reduce((s, r) => s + r.amount, 0);
    let status: "paid" | "partial" | "due" | "upcoming" | "overdue" = "upcoming";
    if (totalPaidByThen >= cum) status = "paid";
    else if (d < new Date()) status = "overdue";
    else if (totalPaidByThen > cum - installment) status = "partial";
    else status = "upcoming";
    rows.push({
      n: i,
      dueDate: d.toISOString(),
      expected: installment,
      cumulativeExpected: cum,
      paidByThen: totalPaidByThen,
      status,
    });
  }
  return rows;
}
