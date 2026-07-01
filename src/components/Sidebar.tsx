import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name?: string | null; role?: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 z-50">
      <div className="h-full overflow-auto bg-blue-600 p-6 text-white shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-800 text-lg font-semibold">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="font-semibold">{profile?.full_name ?? user?.email ?? "User"}</div>
            <div className="text-xs text-blue-200">{profile?.role ?? "—"}</div>
          </div>
        </div>

        <nav className="space-y-1">
          <Link href="/dashboard" className="block rounded-md px-3 py-2 text-white hover:bg-blue-500">
            Dashboard
          </Link>
          <Link href="/dashboard#calendar" className="block rounded-md px-3 py-2 text-white hover:bg-blue-500">
            Kalender
          </Link>
          <Link href="/observations" className="block rounded-md px-3 py-2 text-white hover:bg-blue-500">
            RPP & Nilai
          </Link>
          <Link href="/statistics" className="block rounded-md px-3 py-2 text-white hover:bg-blue-500">
            Statistik
          </Link>
        </nav>
      </div>
    </aside>
  );
}
