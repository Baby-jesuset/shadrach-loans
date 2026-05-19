export type Gender = "male" | "female" | "other";

export interface Member {
  id: string;
  fullName: string;
  gender: Gender;
  phone: string;
  nationalId: string;
  address: string;
  email?: string;
  dateJoined: string; // ISO
  photoUrl?: string;
  active: boolean;
}

export type LoanStatus =
  | "pending"
  | "approved"
  | "active"
  | "paid"
  | "overdue"
  | "defaulted";

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number; // annual %
  durationMonths: number;
  purpose: string;
  issueDate: string; // ISO
  dueDate: string;   // ISO
  status: LoanStatus;
  createdAt: string;
}

export type PaymentMethod = "cash" | "mpesa" | "bank" | "cheque";

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string; // ISO
  method: PaymentMethod;
  note?: string;
}

export interface AppNotification {
  id: string;
  kind: "due" | "overdue" | "approval" | "repayment";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface ManagerProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}
