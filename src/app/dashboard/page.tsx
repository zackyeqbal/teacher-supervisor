import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Middleware sudah memastikan user login; ambil profil + role-nya.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const isSupervisor =
    profile?.role === "supervisor" || profile?.role === "admin";

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action={logout}>
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Keluar
          </button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <p className="text-sm text-gray-500">Halo,</p>
        <p className="text-lg font-medium">
          {profile?.full_name ?? user?.email}
        </p>
        <p className="mt-2 text-sm">
          Role kamu:{" "}
          <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
            {profile?.role ?? "—"}
          </span>
        </p>
      </div>

      <div className="mt-6">
        {isSupervisor ? (
          <Link
            href="/observations"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Kelola Observasi →
          </Link>
        ) : (
          <Link
            href="/my-observations"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Observasi Saya (Unggah RPP) →
          </Link>
        )}
      </div>
    </main>
  );
}
