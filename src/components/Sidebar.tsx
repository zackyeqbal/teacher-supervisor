import { createClient } from "@/lib/supabase/server";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const userEmail = user?.email ?? "user@example.com";
  const userRole = profile?.role ?? "—";

  return <SidebarClient userEmail={userEmail} userRole={userRole} />;
}
