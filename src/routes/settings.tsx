import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore, useTheme } from "@/lib/mock-store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { manager, updateManager } = useStore();
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState(manager);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [prefs, setPrefs] = useState({ emailAlerts: true, smsAlerts: false, overdueDigest: true });

  const initials = profile.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile, security and system preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Manager profile</CardTitle>
            <CardDescription>Update your contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback></Avatar>
              <div>
                <div className="font-display text-lg font-semibold">{profile.name}</div>
                <div className="text-sm text-muted-foreground">Sole administrator</div>
              </div>
            </div>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); updateManager(profile); toast.success("Profile updated"); }}
            >
              <Field label="Full name"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
              <Field label="Phone" className="sm:col-span-2"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">Save profile</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">System preferences</CardTitle>
            <CardDescription>Theme & notification rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Dark mode" hint="Use the dark theme across the app.">
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </Row>
            <Separator />
            <Row label="Email alerts" hint="Loan approvals & overdue alerts via email.">
              <Switch checked={prefs.emailAlerts} onCheckedChange={(v) => setPrefs({ ...prefs, emailAlerts: v })} />
            </Row>
            <Row label="SMS alerts" hint="Notify members by SMS on due dates.">
              <Switch checked={prefs.smsAlerts} onCheckedChange={(v) => setPrefs({ ...prefs, smsAlerts: v })} />
            </Row>
            <Row label="Overdue digest" hint="Daily morning summary of overdue loans.">
              <Switch checked={prefs.overdueDigest} onCheckedChange={(v) => setPrefs({ ...prefs, overdueDigest: v })} />
            </Row>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">Change password</CardTitle>
            <CardDescription>Use a strong unique passphrase.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (pw.next.length < 6) return toast.error("New password must be at least 6 characters");
                if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
                setPw({ current: "", next: "", confirm: "" });
                toast.success("Password updated");
              }}
            >
              <Field label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
              <Field label="New password"><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
              <Field label="Confirm new password"><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
              <div className="sm:col-span-3 flex justify-end">
                <Button type="submit">Update password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      {children}
    </div>
  );
}
