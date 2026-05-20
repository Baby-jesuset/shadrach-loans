import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserCheck, UserX, Eye, FileText, Upload, X, Plane, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/mock-store";
import { formatDate } from "@/lib/loan-utils";
import type { Applicant, DocumentKind, TravelStatus } from "@/lib/types";
import { DESTINATION_COUNTRIES, TRAVEL_STATUS_LABEL } from "@/lib/types";
import { TravelStatusBadge } from "@/components/travel-status-badge";
import { CountryBadge } from "@/components/country-badge";

export const Route = createFileRoute("/members")({ component: ApplicantsPage });

const applicantSchema = z.object({
  fullName: z.string().min(2, "Required"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(7, "Enter a valid phone"),
  altPhone: z.string().optional(),
  nationalId: z.string().min(4, "Required"),
  passportNumber: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  district: z.string().optional(),
  address: z.string().min(2, "Required"),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),

  nokName: z.string().optional(),
  nokRelationship: z.string().optional(),
  nokPhone: z.string().optional(),
  nokAddress: z.string().optional(),

  destinationCountry: z.string().optional(),
  recruitmentAgency: z.string().optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  expectedSalary: z.coerce.number().min(0).optional(),
  contractDurationMonths: z.coerce.number().int().min(0).optional(),
  travelDate: z.string().optional(),
  passportExpiry: z.string().optional(),
  visaStatus: z.enum(["not_started", "processing", "issued", "rejected"]).optional(),
});
type ApplicantForm = z.infer<typeof applicantSchema>;

const TRAVEL_STATUSES: TravelStatus[] = ["processing", "approved", "awaiting_travel", "travelled", "returned", "contract_completed"];

function ApplicantsPage() {
  const { members, addMember, updateMember, deleteMember } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TravelStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Applicant | null>(null);
  const [details, setDetails] = useState<Applicant | null>(null);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) => {
      const matchQ = !q || [m.fullName, m.phone, m.nationalId, m.passportNumber ?? "", m.email ?? "", m.address, m.district ?? "", m.employment?.destinationCountry ?? ""]
        .some((f) => f.toLowerCase().includes(q));
      const matchS = statusFilter === "all" || m.travelStatus === statusFilter;
      return matchQ && matchS;
    });
  }, [members, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (m: Applicant) => { setEditing(m); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Applicants</h2>
          <p className="text-sm text-muted-foreground">Ugandan workers travelling to the Middle East for employment.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />New applicant</Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display">All applicants</CardTitle>
            <CardDescription>{filtered.length} record{filtered.length === 1 ? "" : "s"}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as TravelStatus | "all"); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="awaiting_travel">Awaiting</TabsTrigger>
                <TabsTrigger value="travelled">Travelled</TabsTrigger>
                <TabsTrigger value="returned">Returned</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, NIN, passport, country…" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
              <p className="font-display text-base">No applicants match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or register a new applicant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Applicant</th>
                    <th className="py-2 pr-3 font-medium">Passport / NIN</th>
                    <th className="py-2 pr-3 font-medium">Destination</th>
                    <th className="py-2 pr-3 font-medium">Travel date</th>
                    <th className="py-2 pr-3 font-medium">Travel status</th>
                    <th className="py-2 pr-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{m.fullName.split(" ").map((x) => x[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-medium">{m.fullName}</div>
                            <div className="text-xs text-muted-foreground">{m.district ? `${m.district} · ` : ""}{m.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs">
                        <div>{m.passportNumber ?? "—"}</div>
                        <div className="text-muted-foreground">{m.nationalId}</div>
                      </td>
                      <td className="py-3 pr-3"><CountryBadge country={m.employment?.destinationCountry} /></td>
                      <td className="py-3 pr-3 text-muted-foreground">{m.employment?.travelDate ? formatDate(m.employment.travelDate) : "—"}</td>
                      <td className="py-3 pr-3"><TravelStatusBadge status={m.travelStatus} /></td>
                      <td className="py-3 pr-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetails(m)} title="View"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => updateMember(m.id, { active: !m.active })} title={m.active ? "Deactivate" : "Activate"}>
                            {m.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {m.fullName}?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove the applicant. Loans will still reference this record.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { deleteMember(m.id); toast.success("Applicant deleted"); }}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > pageSize && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-muted-foreground">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ApplicantDialog
        open={open}
        onOpenChange={setOpen}
        applicant={editing}
        onSubmit={(data) => {
          const payload = formToApplicantPayload(data);
          if (editing) {
            updateMember(editing.id, payload);
            toast.success("Applicant updated");
          } else {
            addMember(payload);
            toast.success("Applicant registered");
          }
          setOpen(false);
        }}
      />

      <ApplicantDetailsDialog applicant={details} onClose={() => setDetails(null)} />
    </div>
  );
}

function formToApplicantPayload(d: ApplicantForm) {
  return {
    fullName: d.fullName,
    gender: d.gender,
    dateOfBirth: d.dateOfBirth || undefined,
    phone: d.phone,
    altPhone: d.altPhone || undefined,
    nationalId: d.nationalId,
    passportNumber: d.passportNumber || undefined,
    email: d.email || undefined,
    district: d.district || undefined,
    address: d.address,
    maritalStatus: d.maritalStatus,
    nextOfKin: d.nokName ? {
      name: d.nokName, relationship: d.nokRelationship ?? "",
      phone: d.nokPhone ?? "", address: d.nokAddress ?? "",
    } : undefined,
    employment: d.destinationCountry ? {
      destinationCountry: d.destinationCountry,
      recruitmentAgency: d.recruitmentAgency ?? "",
      employer: d.employer ?? "",
      jobTitle: d.jobTitle ?? "",
      expectedSalary: d.expectedSalary ?? 0,
      contractDurationMonths: d.contractDurationMonths ?? 24,
      travelDate: d.travelDate || undefined,
      passportExpiry: d.passportExpiry || undefined,
      visaStatus: d.visaStatus ?? "not_started",
    } : undefined,
  };
}

function ApplicantDialog({
  open, onOpenChange, applicant, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applicant: Applicant | null;
  onSubmit: (data: ApplicantForm) => void;
}) {
  const form = useForm<ApplicantForm>({
    resolver: zodResolver(applicantSchema),
    values: applicant
      ? {
          fullName: applicant.fullName, gender: applicant.gender,
          dateOfBirth: applicant.dateOfBirth ?? "", phone: applicant.phone,
          altPhone: applicant.altPhone ?? "", nationalId: applicant.nationalId,
          passportNumber: applicant.passportNumber ?? "", email: applicant.email ?? "",
          district: applicant.district ?? "", address: applicant.address,
          maritalStatus: applicant.maritalStatus,
          nokName: applicant.nextOfKin?.name ?? "",
          nokRelationship: applicant.nextOfKin?.relationship ?? "",
          nokPhone: applicant.nextOfKin?.phone ?? "",
          nokAddress: applicant.nextOfKin?.address ?? "",
          destinationCountry: applicant.employment?.destinationCountry ?? "",
          recruitmentAgency: applicant.employment?.recruitmentAgency ?? "",
          employer: applicant.employment?.employer ?? "",
          jobTitle: applicant.employment?.jobTitle ?? "",
          expectedSalary: applicant.employment?.expectedSalary ?? 0,
          contractDurationMonths: applicant.employment?.contractDurationMonths ?? 24,
          travelDate: applicant.employment?.travelDate ?? "",
          passportExpiry: applicant.employment?.passportExpiry ?? "",
          visaStatus: applicant.employment?.visaStatus,
        }
      : {
          fullName: "", gender: "female", dateOfBirth: "", phone: "", altPhone: "",
          nationalId: "", passportNumber: "", email: "", district: "", address: "",
          maritalStatus: "single", nokName: "", nokRelationship: "", nokPhone: "", nokAddress: "",
          destinationCountry: "", recruitmentAgency: "", employer: "", jobTitle: "",
          expectedSalary: 350, contractDurationMonths: 24, travelDate: "", passportExpiry: "",
          visaStatus: "not_started",
        },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{applicant ? "Edit applicant" : "Register new applicant"}</DialogTitle>
          <DialogDescription>Capture full personal, travel and employment details for the worker.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Section title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={form.formState.errors.fullName?.message} className="sm:col-span-2">
                <Input {...form.register("fullName")} placeholder="e.g. Nakato Sarah" />
              </Field>
              <Field label="Gender">
                <Select value={form.watch("gender")} onValueChange={(v) => form.setValue("gender", v as ApplicantForm["gender"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of birth"><Input type="date" {...form.register("dateOfBirth")} /></Field>
              <Field label="National ID (NIN)" error={form.formState.errors.nationalId?.message}>
                <Input {...form.register("nationalId")} placeholder="CM…" />
              </Field>
              <Field label="Passport number"><Input {...form.register("passportNumber")} placeholder="B…" /></Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} placeholder="+256 …" /></Field>
              <Field label="Alternative phone"><Input {...form.register("altPhone")} placeholder="+256 …" /></Field>
              <Field label="Email" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
              <Field label="Marital status">
                <Select value={form.watch("maritalStatus") ?? "single"} onValueChange={(v) => form.setValue("maritalStatus", v as ApplicantForm["maritalStatus"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="District"><Input {...form.register("district")} placeholder="e.g. Wakiso" /></Field>
              <Field label="Village / address" error={form.formState.errors.address?.message} className="sm:col-span-2">
                <Input {...form.register("address")} />
              </Field>
              <Field label="Passport photo (optional)" className="sm:col-span-2">
                <Input type="file" accept="image/*" className="cursor-pointer" />
              </Field>
            </div>
          </Section>

          <Section title="Emergency contact (next of kin)">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input {...form.register("nokName")} /></Field>
              <Field label="Relationship"><Input {...form.register("nokRelationship")} placeholder="e.g. Mother" /></Field>
              <Field label="Phone"><Input {...form.register("nokPhone")} placeholder="+256 …" /></Field>
              <Field label="Address"><Input {...form.register("nokAddress")} /></Field>
            </div>
          </Section>

          <Section title="Travel & employment">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Destination country">
                <Select value={form.watch("destinationCountry") ?? ""} onValueChange={(v) => form.setValue("destinationCountry", v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {DESTINATION_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Recruitment agency"><Input {...form.register("recruitmentAgency")} /></Field>
              <Field label="Employer / company"><Input {...form.register("employer")} /></Field>
              <Field label="Job title"><Input {...form.register("jobTitle")} placeholder="e.g. Domestic Worker" /></Field>
              <Field label="Expected salary (USD/month)"><Input type="number" {...form.register("expectedSalary")} /></Field>
              <Field label="Contract duration (months)"><Input type="number" {...form.register("contractDurationMonths")} /></Field>
              <Field label="Travel date"><Input type="date" {...form.register("travelDate")} /></Field>
              <Field label="Passport expiry"><Input type="date" {...form.register("passportExpiry")} /></Field>
              <Field label="Visa status">
                <Select value={form.watch("visaStatus") ?? "not_started"} onValueChange={(v) => form.setValue("visaStatus", v as ApplicantForm["visaStatus"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{applicant ? "Save changes" : "Register applicant"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DOC_LABELS: Record<DocumentKind, string> = {
  national_id: "National ID",
  passport: "Passport",
  visa: "Visa",
  contract: "Employment Contract",
  other: "Other document",
};

function ApplicantDetailsDialog({ applicant, onClose }: { applicant: Applicant | null; onClose: () => void }) {
  const { setApplicantTravelStatus, addDocument, removeDocument } = useStore();
  const [docKind, setDocKind] = useState<DocumentKind>("passport");
  if (!applicant) return null;

  const ordered = [...applicant.travelHistory].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  return (
    <Dialog open={!!applicant} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display flex flex-wrap items-center gap-2">
            {applicant.fullName}
            <TravelStatusBadge status={applicant.travelStatus} />
            {applicant.employment?.destinationCountry && <CountryBadge country={applicant.employment.destinationCountry} />}
          </DialogTitle>
          <DialogDescription>{applicant.employment?.jobTitle ?? "Applicant profile"} · {applicant.nationalId}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="font-display text-base">Personal</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Info k="Phone" v={applicant.phone} />
              <Info k="Alt phone" v={applicant.altPhone ?? "—"} />
              <Info k="Email" v={applicant.email ?? "—"} />
              <Info k="Date of birth" v={applicant.dateOfBirth ? formatDate(applicant.dateOfBirth) : "—"} />
              <Info k="District" v={applicant.district ?? "—"} />
              <Info k="Marital" v={applicant.maritalStatus ?? "—"} />
              <Info k="Passport" v={applicant.passportNumber ?? "—"} />
              <Info k="Address" v={applicant.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">Next of kin</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {applicant.nextOfKin ? (
                <>
                  <Info k="Name" v={applicant.nextOfKin.name} />
                  <Info k="Relationship" v={applicant.nextOfKin.relationship} />
                  <Info k="Phone" v={applicant.nextOfKin.phone} />
                  <Info k="Address" v={applicant.nextOfKin.address} />
                </>
              ) : <p className="text-muted-foreground">No emergency contact on file.</p>}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="font-display text-base">Employment abroad</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {applicant.employment ? (
                <>
                  <Info k="Destination" v={applicant.employment.destinationCountry} />
                  <Info k="Agency" v={applicant.employment.recruitmentAgency} />
                  <Info k="Employer" v={applicant.employment.employer} />
                  <Info k="Job title" v={applicant.employment.jobTitle} />
                  <Info k="Salary" v={`$${applicant.employment.expectedSalary}/mo`} />
                  <Info k="Contract" v={`${applicant.employment.contractDurationMonths} mo`} />
                  <Info k="Travel date" v={applicant.employment.travelDate ? formatDate(applicant.employment.travelDate) : "—"} />
                  <Info k="Passport expiry" v={applicant.employment.passportExpiry ? formatDate(applicant.employment.passportExpiry) : "—"} />
                  <Info k="Visa status" v={applicant.employment.visaStatus} />
                </>
              ) : <p className="text-muted-foreground col-span-2">Employment details not captured yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2"><Plane className="h-4 w-4" />Travel status</CardTitle>
              <CardDescription>Update workflow stage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={applicant.travelStatus} onValueChange={(v) => { setApplicantTravelStatus(applicant.id, v as TravelStatus); toast.success(`Status set to ${TRAVEL_STATUS_LABEL[v as TravelStatus]}`); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRAVEL_STATUSES.map((s) => <SelectItem key={s} value={s}>{TRAVEL_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setApplicantTravelStatus(applicant.id, "travelled", "Departed"); toast.success("Marked as travelled"); }}>
                <Plane className="mr-1.5 h-4 w-4" />Mark travelled today
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><Clock className="h-4 w-4" />Travel timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {ordered.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-wrap items-center gap-2">
                    <TravelStatusBadge status={ev.status} />
                    <span className="text-xs text-muted-foreground">{formatDate(ev.date)}</span>
                  </div>
                  {ev.note && <p className="mt-1 text-sm text-muted-foreground">{ev.note}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-end justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-base flex items-center gap-2"><FileText className="h-4 w-4" />Documents</CardTitle>
              <CardDescription>{applicant.documents.length} on file</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={docKind} onValueChange={(v) => setDocKind(v as DocumentKind)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOC_LABELS) as DocumentKind[]).map((k) => (
                    <SelectItem key={k} value={k}>{DOC_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="inline-flex">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    addDocument(applicant.id, { kind: docKind, name: file.name, sizeKb: Math.round(file.size / 1024) });
                    toast.success(`${DOC_LABELS[docKind]} uploaded`);
                    e.currentTarget.value = "";
                  }}
                />
                <Button asChild size="sm" variant="outline">
                  <span><Upload className="mr-1.5 h-4 w-4" />Upload</span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {applicant.documents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                No documents yet. Upload National ID, Passport, Visa or Employment Contract.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {applicant.documents.map((d) => (
                  <div key={d.id} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{DOC_LABELS[d.kind]} · {d.sizeKb ?? 0} KB</div>
                    </div>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => removeDocument(applicant.id, d.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
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

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-medium capitalize">{v}</div>
    </div>
  );
}
