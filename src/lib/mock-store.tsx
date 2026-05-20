import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Loan, Member, Repayment, AppNotification, ManagerProfile,
  TravelStatus, DocumentRecord, TravelEvent, Guarantor,
} from "./types";

interface StoreState {
  members: Member[];
  loans: Loan[];
  repayments: Repayment[];
  notifications: AppNotification[];
  manager: ManagerProfile;
}

interface StoreApi extends StoreState {
  addMember: (m: Omit<Member, "id" | "active" | "dateJoined" | "travelHistory" | "documents" | "travelStatus"> & {
    dateJoined?: string; travelStatus?: TravelStatus;
  }) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  setApplicantTravelStatus: (id: string, status: TravelStatus, note?: string) => void;
  addDocument: (memberId: string, doc: Omit<DocumentRecord, "id" | "uploadedAt">) => void;
  removeDocument: (memberId: string, docId: string) => void;
  addLoan: (l: Omit<Loan, "id" | "createdAt" | "status" | "guarantors"> & {
    status?: Loan["status"]; guarantors?: Guarantor[];
  }) => Loan;
  updateLoan: (id: string, patch: Partial<Loan>) => void;
  addRepayment: (r: Omit<Repayment, "id">) => Repayment;
  markNotificationRead: (id: string) => void;
  updateManager: (patch: Partial<ManagerProfile>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const mk = (over: Partial<Member> & Pick<Member, "id" | "fullName" | "gender" | "phone" | "nationalId" | "address" | "dateJoined">): Member => ({
  active: true,
  travelStatus: "processing",
  travelHistory: [{ id: uid(), status: "processing", date: over.dateJoined, note: "Application received" }],
  documents: [],
  ...over,
});

const seedMembers: Member[] = [
  mk({
    id: "m1", fullName: "Nakato Sarah", gender: "female", dateOfBirth: "1996-04-12",
    phone: "+256 772 345 678", altPhone: "+256 701 223 109", nationalId: "CM96041210ABCD",
    passportNumber: "B0457821", email: "sarah.nakato@example.com", district: "Wakiso",
    address: "Kasangati, Plot 14", maritalStatus: "single", dateJoined: "2025-09-14",
    nextOfKin: { name: "Mary Nakato", relationship: "Mother", phone: "+256 772 100 020", address: "Kasangati" },
    employment: {
      destinationCountry: "Saudi Arabia", recruitmentAgency: "Pearl Manpower Ltd",
      employer: "Al Faisal Household Services", jobTitle: "Domestic Worker",
      expectedSalary: 320, contractDurationMonths: 24,
      travelDate: "2026-06-10", passportExpiry: "2030-02-04", visaStatus: "issued",
    },
    travelStatus: "awaiting_travel",
    travelHistory: [
      { id: uid(), status: "processing", date: "2025-09-14", note: "Application received" },
      { id: uid(), status: "approved", date: "2026-02-21", note: "Cleared by recruiter" },
      { id: uid(), status: "awaiting_travel", date: "2026-04-30", note: "Visa issued" },
    ],
  }),
  mk({
    id: "m2", fullName: "Mukasa Brian", gender: "male", dateOfBirth: "1993-11-02",
    phone: "+256 752 991 233", nationalId: "CM93110210EFGH", passportNumber: "B0612009",
    email: "brian.mukasa@example.com", district: "Kampala", address: "Ntinda, Block C",
    maritalStatus: "married", dateJoined: "2024-12-02",
    nextOfKin: { name: "Aisha Mukasa", relationship: "Wife", phone: "+256 772 808 909", address: "Ntinda" },
    employment: {
      destinationCountry: "United Arab Emirates", recruitmentAgency: "Gulf Bridge Recruiters",
      employer: "Emirates Hospitality Group", jobTitle: "Hotel Cleaner",
      expectedSalary: 450, contractDurationMonths: 24,
      travelDate: "2025-04-18", passportExpiry: "2029-08-15", visaStatus: "issued",
    },
    travelStatus: "travelled",
    travelHistory: [
      { id: uid(), status: "processing", date: "2024-12-02" },
      { id: uid(), status: "approved", date: "2025-01-20" },
      { id: uid(), status: "awaiting_travel", date: "2025-03-09" },
      { id: uid(), status: "travelled", date: "2025-04-18", note: "Departed via EBB" },
    ],
  }),
  mk({
    id: "m3", fullName: "Achieng Catherine", gender: "female", dateOfBirth: "1998-06-21",
    phone: "+256 753 887 221", nationalId: "CF98062110IJKL", passportNumber: "B0489210",
    district: "Jinja", address: "Bugembe", maritalStatus: "single", dateJoined: "2023-11-21",
    nextOfKin: { name: "John Okello", relationship: "Brother", phone: "+256 772 990 100", address: "Bugembe" },
    employment: {
      destinationCountry: "Qatar", recruitmentAgency: "Doha Talent Hub",
      employer: "Sahara Cleaning Co.", jobTitle: "Cleaner",
      expectedSalary: 380, contractDurationMonths: 24,
      travelDate: "2024-03-04", passportExpiry: "2028-12-12", visaStatus: "issued",
    },
    travelStatus: "contract_completed",
    travelHistory: [
      { id: uid(), status: "processing", date: "2023-11-21" },
      { id: uid(), status: "travelled", date: "2024-03-04" },
      { id: uid(), status: "returned", date: "2026-03-06", note: "End of contract" },
      { id: uid(), status: "contract_completed", date: "2026-03-20" },
    ],
  }),
  mk({
    id: "m4", fullName: "Tumwine Daniel", gender: "male", dateOfBirth: "1995-01-09",
    phone: "+256 701 223 998", nationalId: "CM95010910MNOP", passportNumber: "B0731120",
    email: "daniel.t@example.com", district: "Mbarara", address: "Kakoba",
    maritalStatus: "married", dateJoined: "2025-01-09",
    nextOfKin: { name: "Grace Tumwine", relationship: "Wife", phone: "+256 772 444 555", address: "Kakoba" },
    employment: {
      destinationCountry: "Kuwait", recruitmentAgency: "Pearl Manpower Ltd",
      employer: "Al Salem Industries", jobTitle: "Construction Helper",
      expectedSalary: 500, contractDurationMonths: 24,
      travelDate: "2026-07-05", passportExpiry: "2031-05-20", visaStatus: "processing",
    },
    travelStatus: "approved",
    travelHistory: [
      { id: uid(), status: "processing", date: "2025-01-09" },
      { id: uid(), status: "approved", date: "2026-03-17", note: "Contract signed" },
    ],
  }),
  mk({
    id: "m5", fullName: "Namaganda Esther", gender: "female", dateOfBirth: "1999-08-30",
    phone: "+256 715 110 442", nationalId: "CF99083010QRST", passportNumber: "B0822199",
    district: "Mukono", address: "Seeta", maritalStatus: "single", dateJoined: "2024-08-30",
    nextOfKin: { name: "Peter Ssempa", relationship: "Uncle", phone: "+256 772 010 020", address: "Seeta" },
    employment: {
      destinationCountry: "Oman", recruitmentAgency: "Muscat Workforce",
      employer: "Royal Family Household", jobTitle: "Housekeeper",
      expectedSalary: 350, contractDurationMonths: 24,
      travelDate: "2026-05-22", passportExpiry: "2029-11-04", visaStatus: "issued",
    },
    travelStatus: "travelled",
    travelHistory: [
      { id: uid(), status: "processing", date: "2024-08-30" },
      { id: uid(), status: "approved", date: "2025-12-01" },
      { id: uid(), status: "travelled", date: "2026-05-22" },
    ],
  }),
  mk({
    id: "m6", fullName: "Ngugi Felix", gender: "male", dateOfBirth: "1992-03-17",
    phone: "+256 720 554 008", nationalId: "CM92031710UVWX",
    district: "Gulu", address: "Layibi", maritalStatus: "single", dateJoined: "2025-03-17",
    active: false, travelStatus: "processing",
  }),
];

const defaultGuarantor = (over: Partial<Guarantor> & Pick<Guarantor, "fullName" | "nationalId" | "phone" | "address" | "occupation" | "relationship">): Guarantor =>
  ({ id: uid(), ...over });

const seedLoans: Loan[] = [
  { id: "L-1001", memberId: "m1", amount: 4500000, interestRate: 12, durationMonths: 12, purpose: "Recruitment & travel fees", issueDate: "2026-01-10", disbursementDate: "2026-01-12", dueDate: "2027-01-10", status: "active", createdAt: "2026-01-08",
    guarantors: [defaultGuarantor({ fullName: "Mary Nakato", nationalId: "CF65111010AAAA", phone: "+256 772 100 020", address: "Kasangati", occupation: "Trader", relationship: "Mother" })] },
  { id: "L-1002", memberId: "m2", amount: 3200000, interestRate: 10, durationMonths: 6, purpose: "Passport, visa & medicals", issueDate: "2025-03-01", disbursementDate: "2025-03-03", dueDate: "2025-09-01", status: "overdue", createdAt: "2025-02-25",
    guarantors: [defaultGuarantor({ fullName: "Aisha Mukasa", nationalId: "CF94020110BBBB", phone: "+256 772 808 909", address: "Ntinda", occupation: "Teacher", relationship: "Wife" })] },
  { id: "L-1003", memberId: "m3", amount: 2800000, interestRate: 14, durationMonths: 6, purpose: "Agency processing fees", issueDate: "2024-01-01", disbursementDate: "2024-01-02", dueDate: "2024-07-01", status: "paid", createdAt: "2023-12-28",
    guarantors: [defaultGuarantor({ fullName: "John Okello", nationalId: "CM95071010CCCC", phone: "+256 772 990 100", address: "Bugembe", occupation: "Driver", relationship: "Brother" })] },
  { id: "L-1004", memberId: "m4", amount: 5500000, interestRate: 11, durationMonths: 18, purpose: "Travel & medical clearance", issueDate: "2026-04-15", disbursementDate: "2026-04-20", dueDate: "2027-10-15", status: "active", createdAt: "2026-04-10",
    guarantors: [
      defaultGuarantor({ fullName: "Grace Tumwine", nationalId: "CF96050510DDDD", phone: "+256 772 444 555", address: "Kakoba", occupation: "Nurse", relationship: "Wife" }),
      defaultGuarantor({ fullName: "Robert Atuhaire", nationalId: "CM85090110EEEE", phone: "+256 772 666 777", address: "Mbarara", occupation: "Civil Servant", relationship: "Cousin" }),
    ] },
  { id: "L-1005", memberId: "m5", amount: 1800000, interestRate: 12, durationMonths: 4, purpose: "Passport renewal & visa", issueDate: "2026-02-05", disbursementDate: "2026-02-06", dueDate: "2026-06-05", status: "active", createdAt: "2026-02-01",
    guarantors: [defaultGuarantor({ fullName: "Peter Ssempa", nationalId: "CM70061010FFFF", phone: "+256 772 010 020", address: "Seeta", occupation: "Mechanic", relationship: "Uncle" })] },
  { id: "L-1006", memberId: "m1", amount: 2100000, interestRate: 10, durationMonths: 6, purpose: "Pre-departure expenses", issueDate: "2026-05-01", disbursementDate: undefined, dueDate: "2026-11-01", status: "pending", createdAt: "2026-05-12", guarantors: [] },
  { id: "L-1007", memberId: "m2", amount: 1500000, interestRate: 12, durationMonths: 5, purpose: "Family support during travel", issueDate: "2026-05-10", dueDate: "2026-10-10", status: "approved", createdAt: "2026-05-15", guarantors: [] },
];

const seedRepayments: Repayment[] = [
  { id: "r1", loanId: "L-1001", amount: 420000, date: "2026-02-10", method: "mpesa" },
  { id: "r2", loanId: "L-1001", amount: 420000, date: "2026-03-10", method: "mpesa" },
  { id: "r3", loanId: "L-1001", amount: 420000, date: "2026-04-10", method: "bank" },
  { id: "r4", loanId: "L-1001", amount: 420000, date: "2026-05-10", method: "mpesa" },
  { id: "r5", loanId: "L-1002", amount: 560000, date: "2025-04-01", method: "cash" },
  { id: "r6", loanId: "L-1002", amount: 560000, date: "2025-05-02", method: "mpesa" },
  { id: "r7", loanId: "L-1003", amount: 3050000, date: "2024-07-01", method: "bank" },
  { id: "r8", loanId: "L-1004", amount: 380000, date: "2026-05-15", method: "mpesa" },
  { id: "r9", loanId: "L-1005", amount: 480000, date: "2026-04-05", method: "cash" },
];

const seedNotifications: AppNotification[] = [
  { id: "n1", kind: "overdue", title: "Overdue loan", message: "L-1002 (Mukasa Brian) is past due.", date: new Date().toISOString(), read: false },
  { id: "n2", kind: "travel", title: "Upcoming departure", message: "Nakato Sarah is scheduled to travel to Saudi Arabia.", date: new Date().toISOString(), read: false },
  { id: "n3", kind: "approval", title: "New application", message: "L-1006 awaiting your review.", date: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: "n4", kind: "repayment", title: "Payment received", message: "UGX 420,000 received for L-1001.", date: new Date(Date.now() - 2 * 86400000).toISOString(), read: true },
];

const seedManager: ManagerProfile = {
  name: "James Karanja",
  email: "manager@pearlbridge.co.ug",
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
      const dateJoined = m.dateJoined ?? new Date().toISOString();
      const travelStatus = m.travelStatus ?? "processing";
      const initialEvent: TravelEvent = { id: uid(), status: travelStatus, date: dateJoined, note: "Application received" };
      const member: Member = {
        ...m, id: uid(), active: true, dateJoined,
        travelStatus, travelHistory: [initialEvent], documents: [],
      };
      setMembers((prev) => [member, ...prev]);
      return member;
    },
    updateMember: (id, patch) => setMembers((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    deleteMember: (id) => setMembers((p) => p.filter((x) => x.id !== id)),
    setApplicantTravelStatus: (id, status, note) => setMembers((p) => p.map((x) => {
      if (x.id !== id) return x;
      const event: TravelEvent = { id: uid(), status, date: new Date().toISOString(), note };
      return { ...x, travelStatus: status, travelHistory: [...x.travelHistory, event] };
    })),
    addDocument: (memberId, doc) => setMembers((p) => p.map((x) => x.id === memberId
      ? { ...x, documents: [...x.documents, { ...doc, id: uid(), uploadedAt: new Date().toISOString() }] }
      : x)),
    removeDocument: (memberId, docId) => setMembers((p) => p.map((x) => x.id === memberId
      ? { ...x, documents: x.documents.filter((d) => d.id !== docId) } : x)),
    addLoan: (l) => {
      const loan: Loan = {
        ...l,
        guarantors: l.guarantors ?? [],
        id: `L-${1000 + Math.floor(Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        status: l.status ?? "pending",
      };
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
