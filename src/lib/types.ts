export type Gender = "male" | "female" | "other";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";
export type VisaStatus = "not_started" | "processing" | "issued" | "rejected";

export type TravelStatus =
  | "processing"
  | "approved"
  | "awaiting_travel"
  | "travelled"
  | "returned"
  | "contract_completed";

export const DESTINATION_COUNTRIES = [
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Jordan",
  "Lebanon",
] as const;
export type DestinationCountry = (typeof DESTINATION_COUNTRIES)[number];

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface OverseasEmployment {
  destinationCountry: DestinationCountry | string;
  recruitmentAgency: string;
  employer: string;
  jobTitle: string;
  expectedSalary: number; // monthly, in USD
  contractDurationMonths: number;
  travelDate?: string; // ISO
  passportExpiry?: string; // ISO
  visaStatus: VisaStatus;
}

export type DocumentKind = "national_id" | "passport" | "visa" | "contract" | "other";

export interface DocumentRecord {
  id: string;
  kind: DocumentKind;
  name: string;
  url?: string; // mock data URL or path
  uploadedAt: string;
  sizeKb?: number;
}

export interface TravelEvent {
  id: string;
  status: TravelStatus;
  date: string;
  note?: string;
}

/** Applicant = the Ugandan worker travelling abroad. Backwards compatible with the previous Member type. */
export interface Member {
  id: string;
  fullName: string;
  gender: Gender;
  dateOfBirth?: string; // ISO
  phone: string;
  altPhone?: string;
  nationalId: string;
  passportNumber?: string;
  email?: string;
  district?: string;
  address: string; // village / address
  maritalStatus?: MaritalStatus;
  photoUrl?: string;
  dateJoined: string;
  active: boolean;

  nextOfKin?: NextOfKin;
  employment?: OverseasEmployment;
  travelStatus: TravelStatus;
  travelHistory: TravelEvent[];
  documents: DocumentRecord[];
}

export type Applicant = Member;

export type LoanStatus =
  | "pending"
  | "approved"
  | "active"
  | "paid"
  | "overdue"
  | "defaulted";

export interface Guarantor {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  address: string;
  occupation: string;
  relationship: string;
  idDocUrl?: string;
  signatureUrl?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  purpose: string;
  issueDate: string;
  disbursementDate?: string;
  dueDate: string;
  status: LoanStatus;
  createdAt: string;
  guarantors: Guarantor[];
}

export type PaymentMethod = "cash" | "mpesa" | "bank" | "cheque";

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note?: string;
}

export interface AppNotification {
  id: string;
  kind: "due" | "overdue" | "approval" | "repayment" | "travel";
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

export const TRAVEL_STATUS_LABEL: Record<TravelStatus, string> = {
  processing: "Processing",
  approved: "Approved",
  awaiting_travel: "Awaiting Travel",
  travelled: "Travelled",
  returned: "Returned",
  contract_completed: "Contract Completed",
};
