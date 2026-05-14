import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type DbRole, ROLE_LABELS } from "@/lib/auth";
import { RoleGate } from "@/components/RoleGate";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/app/admin/users")({
  component: () => (
    <RoleGate allow={[]}>
      <AdminUsers />
    </RoleGate>
  ),
});

const ALL_ROLES: DbRole[] = ["admin", "dispatcher", "driver", "caregiver", "broker", "provider"];

interface Row {
  user_id: string;
  email: string;
  roles: DbRole[];
}

function AdminUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Record<string, DbRole>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const grant = async (uid: string, role: DbRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${ROLE_LABELS[role]}`);
    load();
  };

  const revoke = async (uid: string, role: DbRole) => {
    if (uid === user?.id && role === "admin") {
      if (!confirm("Remove your own admin role? You will lose access to this page.")) return;
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", uid)
      .eq("role", role);
    if (error) return toast.error(error.message);
    toast.success("Role removed");
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User access</h1>
        <p className="text-sm text-muted-foreground">
          Assign roles to control which pages each user can see.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No users yet.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const available = ALL_ROLES.filter((x) => !r.roles.includes(x));
                const pending = adding[r.user_id] ?? available[0];
                return (
                  <div
                    key={r.user_id}
                    className="flex flex-col md:flex-row md:items-center gap-3 border rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.email}
                        {r.user_id === user?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            No roles — pending access
                          </span>
                        )}
                        {r.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="gap-1">
                            {ROLE_LABELS[role]}
                            <button
                              onClick={() => revoke(r.user_id, role)}
                              className="hover:text-destructive"
                              aria-label="Remove role"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {available.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={pending}
                          onValueChange={(v) =>
                            setAdding((p) => ({ ...p, [r.user_id]: v as DbRole }))
                          }
                        >
                          <SelectTrigger className="h-9 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((x) => (
                              <SelectItem key={x} value={x}>
                                {ROLE_LABELS[x]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => grant(r.user_id, pending)}>
                          Grant
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
