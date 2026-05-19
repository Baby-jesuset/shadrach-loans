import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellRing, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/mock-store";
import { formatDate } from "@/lib/loan-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const kindMeta = {
  due:       { icon: Calendar,     tone: "bg-primary/10 text-primary" },
  overdue:   { icon: AlertTriangle, tone: "bg-warning/15 text-warning" },
  approval:  { icon: BellRing,      tone: "bg-gold/15 text-gold-foreground dark:text-gold" },
  repayment: { icon: CheckCircle2,  tone: "bg-success/15 text-success" },
} as const;

function NotificationsPage() {
  const { notifications, markNotificationRead } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">Stay on top of due dates, approvals and incoming payments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Inbox</CardTitle>
          <CardDescription>{notifications.filter((n) => !n.read).length} unread</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {notifications.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
              <p className="font-display text-base">You're all caught up</p>
            </div>
          )}
          {notifications.map((n) => {
            const meta = kindMeta[n.kind];
            const Icon = meta.icon;
            return (
              <div key={n.id} className={cn("flex items-start gap-4 py-4", !n.read && "bg-accent/30 -mx-6 px-6")}>
                <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", meta.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{n.title}</h3>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.date)}</p>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markNotificationRead(n.id)}>Mark read</Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
