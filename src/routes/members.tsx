import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/mock-store";
import { formatDate } from "@/lib/loan-utils";
import type { Member } from "@/lib/types";

export const Route = createFileRoute("/members")({ component: MembersPage });

const memberSchema = z.object({
  fullName: z.string().min(2, "Required"),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(7, "Enter a valid phone"),
  nationalId: z.string().min(4, "Required"),
  address: z.string().min(2, "Required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
});
type MemberForm = z.infer<typeof memberSchema>;

function MembersPage() {
  const { members, addMember, updateMember, deleteMember } = useStore();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) =>
      [m.fullName, m.phone, m.nationalId, m.email ?? "", m.address].some((f) => f.toLowerCase().includes(q))
    );
  }, [members, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (m: Member) => { setEditing(m); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">Manage your SACCO membership records.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />Add member</Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display">All members</CardTitle>
            <CardDescription>{filtered.length} record{filtered.length === 1 ? "" : "s"}</CardDescription>
          </div>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name, phone, ID…" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
              <p className="font-display text-base">No members match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different keyword or add a new member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Member</th>
                    <th className="py-2 pr-3 font-medium">National ID</th>
                    <th className="py-2 pr-3 font-medium">Phone</th>
                    <th className="py-2 pr-3 font-medium">Joined</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
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
                            <div className="text-xs text-muted-foreground">{m.email || m.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs">{m.nationalId}</td>
                      <td className="py-3 pr-3">{m.phone}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{formatDate(m.dateJoined)}</td>
                      <td className="py-3 pr-3">
                        {m.active
                          ? <Badge variant="outline" className="bg-success/15 text-success border-success/25">Active</Badge>
                          : <Badge variant="outline" className="bg-muted text-muted-foreground">Inactive</Badge>}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex justify-end gap-1">
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
                                <AlertDialogDescription>
                                  This will permanently remove the member from your records. Existing loans will still reference this member.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { deleteMember(m.id); toast.success("Member deleted"); }}>Delete</AlertDialogAction>
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

          {/* Pagination */}
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

      <MemberDialog
        open={open}
        onOpenChange={setOpen}
        member={editing}
        onSubmit={(data) => {
          if (editing) {
            updateMember(editing.id, data);
            toast.success("Member updated");
          } else {
            addMember(data);
            toast.success("Member added");
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function MemberDialog({
  open, onOpenChange, member, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: Member | null;
  onSubmit: (data: MemberForm) => void;
}) {
  const form = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    values: member
      ? { fullName: member.fullName, gender: member.gender, phone: member.phone, nationalId: member.nationalId, address: member.address, email: member.email ?? "" }
      : { fullName: "", gender: "male", phone: "", nationalId: "", address: "", email: "" },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{member ? "Edit member" : "Add new member"}</DialogTitle>
          <DialogDescription>Member records are used across loans and repayments.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={form.formState.errors.fullName?.message} className="sm:col-span-2">
            <Input {...form.register("fullName")} placeholder="e.g. Aisha Kamau" />
          </Field>
          <Field label="Gender">
            <Select value={form.watch("gender")} onValueChange={(v) => form.setValue("gender", v as MemberForm["gender"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <Input {...form.register("phone")} placeholder="+254 …" />
          </Field>
          <Field label="National ID" error={form.formState.errors.nationalId?.message}>
            <Input {...form.register("nationalId")} />
          </Field>
          <Field label="Email (optional)" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Address" error={form.formState.errors.address?.message} className="sm:col-span-2">
            <Input {...form.register("address")} />
          </Field>
          <Field label="Passport photo (optional)" className="sm:col-span-2">
            <Input type="file" accept="image/*" className="cursor-pointer" />
          </Field>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{member ? "Save changes" : "Add member"}</Button>
          </DialogFooter>
        </form>
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
