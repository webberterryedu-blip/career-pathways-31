// Shared auth helper for edge functions.
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
  status: number;
}

export async function requireAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing Authorization header", status: 401 };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: "Invalid or expired token", status: 401 };
  }
  return { user: { id: data.user.id, email: data.user.email }, error: null, status: 200 };
}

export async function requireStaffRole(req: Request): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (!auth.user) return auth;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id);

  if (error) {
    return { user: null, error: "Role lookup failed", status: 500 };
  }
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("instrutor")) {
    return { user: null, error: "Forbidden: staff role required", status: 403 };
  }
  return auth;
}
