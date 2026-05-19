import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Loan, Member, Repayment, AppNotification, ManagerProfile } from "./types";

interface StoreState {
  members: Member[];
  loans: Loan[];
  repayments: Repayment[];
  notifications: AppNotification[];
  manager: ManagerProfile;
}

interface StoreApi extends StoreState {
  addMember: (m: Omit<Member, "id" | "active" | "dateJoined"> & { dateJoined?: string }) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addLoan: (l: Omit<Loan, "id" | "createdAt" | "status"> & { status?: Loan["status"] }) => Loan;
  updateLoan: (id: string, patch: Partial<Loan>) => void;
  addRepayment: (r: Omit<Repayment, "id">) => Repayment;
  markNotificationRead: (id: string) => void;
  updateManager: (patch: Partial<ManagerProfile>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const seedMembers: Member[] = [
  { id: "m1", fullName: "Aisha Kamau", gender: "female", phone: "+256 712 345 678", nationalId: "29845671", address: "Nairobi, Westlands", email: "aisha@example.com", dateJoined: "2024-02-14", active: true },
  { id: "m2", fullName: "Brian Otieno", gender: "male", phone: "+256 722 991 233", nationalId: "31002984", address: "Kisumu, Milimani", email: "brian@example.com", dateJoined: "2024-04-02", active: true },
  { id: "m3", fullName: "Catherine Wanjiru", gender: "female", phone: "+256 733 887 221", nationalId: "27634551", address: "Nakuru, CBD", dateJoined: "2023-11-21", active: true },
  { id: "m4", fullName: "Daniel Mwangi", gender: "male", phone: "+256 701 223 998", nationalId: "33119087", address: "Thika Road", email: "dan.m@example.com", dateJoined: "2025-01-09", active: true },
  { id: "m5", fullName: "Esther Achieng", gender: "female", phone: "+256 715 110 442", nationalId: "29881076", address: "Mombasa, Nyali", dateJoined: "2024-08-30", active: true },
  { id: "m6", fullName: "Felix Ngugi", gender: "male", phone: "+256 720 554 008", nationalId: "30887412", address: "Eldoret", dateJoined: "2025-03-17", active: false },
];

const seedLoans: Loan[] = [
  { id: "L-1001", memberId: "m1", amount: 150000, interestRate: 12, durationMonths: 12, purpose: "Small business expansion", issueDate: "2025-01-10", dueDate: "2026-01-10", status: "active", createdAt: "2025-01-08" },
  { id: "L-1002", memberId: "m2", amount: 80000, interestRate: 10, durationMonths: 6, purpose: "School fees", issueDate: "2025-03-01", dueDate: "2025-09-01", status: "overdue", createdAt: "2025-02-25" },
  { id: "L-1003", memberId: "m3", amount: 50000, interestRate: 14, durationMonths: 6, purpose: "Medical", issueDate: "2024-12-01", dueDate: "2025-06-01", status: "paid", createdAt: "2024-11-28" },
  { id: "L-1004", memberId: "m4", amount: 220000, interestRate: 11, durationMonths: 18, purpose: "Land purchase", issueDate: "2025-04-15", dueDate: "2026-10-15", status: "active", createdAt: "2025-04-10" },
  { id: "L-1005", memberId: "m5", amount: 35000, interestRate: 12, durationMonths: 4, purpose: "Inventory restock", issueDate: "2025-05-05", dueDate: "2025-09-05", status: "active", createdAt: "2025-05-01" },
  { id: "L-1006", memberId: "m1", amount: 60000, interestRate: 10, durationMonths: 6, purpose: "Equipment", issueDate: "2026-05-01", dueDate: "2026-11-01", status: "pending", createdAt: "2026-05-12" },
  { id: "L-1007", memberId: "m2", amount: 45000, interestRate: 12, durationMonths: 5, purpose: "Personal", issueDate: "2026-05-10", dueDate: "2026-10-10", status: "approved", createdAt: "2026-05-15" },
];

const seedRepayments: Repayment[] = [
  { id: "r1", loanId: "L-1001", amount: 14000, date: "2025-02-10", method: "mpesa" },
  { id: "r2", loanId: "L-1001", amount: 14000, date: "2025-03-10", method: "mpesa" },
  { id: "r3", loanId: "L-1001", amount: 14000, date: "2025-04-10", method: "bank" },
  { id: "r4", loanId: "L-1001", amount: 14000, date: "2025-05-10", method: "mpesa" },
  { id: "r5", loanId: "L-1002", amount: 14000, date: "2025-04-01", method: "cash" },
  { id: "r6", loanId: "L-1002", amount: 14000, date: "2025-05-02", method: "mpesa" },
  { id: "r7", loanId: "L-1003", amount: 54500, date: "2025-06-01", method: "bank" },
  { id: "r8", loanId: "L-1004", amount: 14600, date: "2025-05-15", method: "mpesa" },
  { id: "r9", loanId: "L-1005", amount: 9300, date: "2025-06-05", method: "cash" },
];

const seedNotifications: AppNotification[] = [
  { id: "n1", kind: "overdue", title: "Overdue loan", message: "L-1002 (Brian Otieno) is past due.", date: new Date().toISOString(), read: false },
  { id: "n2", kind: "due", title: "Upcoming due date", message: "L-1005 installment due in 3 days.", date: new Date().toISOString(), read: false },
  { id: "n3", kind: "approval", title: "New application", message: "L-1006 awaiting your review.", date: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: "n4", kind: "repayment", title: "Payment received", message: "KES 14,000 received for L-1001.", date: new Date(Date.now() - 2 * 86400000).toISOString(), read: true },
];

const seedManager: ManagerProfile = {
  name: "James Kasanja",
  email: "manager@shadrach-loans.co.ug",
  phone: "+256 711 000 111",
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [loans, setLoans] = useState<Loan[]>(seedLoans);
  const [repayments, setRepayments] = useState<Repayment[]>(seedRepayments);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [manager, setManager] = useState<ManagerProfile>(seedManager);

  const api = useMemo<StoreApi>(() => ({
    members, loans, repayments, notifications, manager,
    addMember: (m) => {
      const member: Member = { ...m, id: uid(), active: true, dateJoined: m.dateJoined ?? new Date().toISOString() };
      setMembers((prev) => [member, ...prev]);
      return member;
    },
    updateMember: (id, patch) => setMembers((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    deleteMember: (id) => setMembers((p) => p.filter((x) => x.id !== id)),
    addLoan: (l) => {
      const loan: Loan = { ...l, id: `L-${1000 + Math.floor(Math.random() * 9000)}`, createdAt: new Date().toISOString(), status: l.status ?? "pending" };
      setLoans((p) => [loan, ...p]);
      return loan;
    },
    updateLoan: (id, patch) => setLoans((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    addRepayment: (r) => {
      const rep: Repayment = { ...r, id: uid() };
      setRepayments((p) => [rep, ...p]);
      return rep;
    },
    markNotificationRead: (id) =>
      setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n))),
    updateManager: (patch) => setManager((m) => ({ ...m, ...patch })),
  }), [members, loans, repayments, notifications, manager]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/* ---------- Theme ---------- */
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("sacco-theme")) as Theme | null;
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("sacco-theme", theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/* ---------- Auth (mock) ---------- */
const AuthContext = createContext<{ authed: boolean; login: (e: string, p: string) => boolean; logout: () => void } | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(typeof window !== "undefined" && localStorage.getItem("sacco-auth") === "1");
  }, []);
  return (
    <AuthContext.Provider
      value={{
        authed,
        login: (email, password) => {
          if (email && password.length >= 4) {
            localStorage.setItem("sacco-auth", "1");
            setAuthed(true);
            return true;
          }
          return false;
        },
        logout: () => {
          localStorage.removeItem("sacco-auth");
          setAuthed(false);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
