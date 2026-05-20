import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plane, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/mock-store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Pearl Bridge" }] }),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@pearl-bridge.co.ke");
  const [password, setPassword] = useState("manager123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (ok) {
        toast.success("Welcome back, Manager");
        navigate({ to: "/" });
      } else {
        toast.error("Invalid credentials. Password must be at least 4 characters.");
      }
    }, 500);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.78_0.13_85/.18),transparent_60%),radial-gradient(circle_at_80%_80%,oklch(0.45_0.1_165/.25),transparent_55%)]" />
        <div className="relative flex h-full flex-col p-12">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold text-gold-foreground">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">Pearl Bridge</div>
              <div className="text-xs text-sidebar-foreground/60">Loan Management Platform</div>
            </div>
          </div>

          <div className="mt-auto max-w-md">
            <h2 className="font-display text-4xl font-semibold leading-tight">
              Run your SACCO with calm precision.
            </h2>
            <p className="mt-3 text-sm text-sidebar-foreground/70">
              Members, loans, repayments and overdue tracking in one elegant manager workspace
              built for daily financial operations.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-sidebar-foreground/70">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Secure single-manager access
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md border-border/70 shadow-lg">
          <CardContent className="p-8">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold">Pearl Bridge</div>
                <div className="text-xs text-muted-foreground">Loan Manager</div>
              </div>
            </div>

            <h1 className="font-display text-2xl font-semibold">Manager sign-in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Access your SACCO's loan operations dashboard.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo credentials are pre-filled. Use any email and a 4+ char password.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
