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

  type UpcomingObservation = {
    id: string;
    observed_at: string;
    status: string;
    class_name: string | null;
    teacher: Array<{ full_name: string | null; subject: string | null }> | null;
    teaching_roles: Array<{ name: string | null }> | null;
  };

  let upcomingObservations: UpcomingObservation[] = [];

  if (isSupervisor) {
    const today = new Date().toISOString().slice(0, 10);
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 14);
    const limitDate = weekAhead.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("observations")
      .select(
        "id, observed_at, status, class_name, teacher:profiles!teacher_id(full_name, subject), teaching_roles(name)",
      )
      .eq("status", "terjadwal")
      .gte("observed_at", today)
      .lte("observed_at", limitDate)
      .order("observed_at", { ascending: true })
      .limit(5);

    upcomingObservations = (data ?? []) as UpcomingObservation[];
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
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

      {isSupervisor && (
        <section className="mt-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Observasi Mendatang</h2>
              <p className="text-sm text-gray-500">
                Daftar guru yang akan diobservasi dalam 14 hari ke depan, dari
                yang paling dekat.
              </p>
            </div>
            <Link
              href="/observations"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {upcomingObservations.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
              Belum ada observasi terjadwal dalam 14 hari ke depan.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingObservations.map((observation) => {
                const teacher = Array.isArray(observation.teacher)
                  ? observation.teacher[0]
                  : observation.teacher;
                const role = Array.isArray(observation.teaching_roles)
                  ? observation.teaching_roles[0]
                  : observation.teaching_roles;

                return (
                  <li
                    key={observation.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {teacher?.full_name ?? "—"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {role?.name && (
                            <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                              {role.name}
                            </span>
                          )}
                          {teacher?.subject ?? "—"} · {observation.class_name ?? "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(observation.observed_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs font-medium text-amber-700">
                          {observation.status}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
