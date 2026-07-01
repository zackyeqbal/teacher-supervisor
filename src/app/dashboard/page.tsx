import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - startOffset + 1;
    const currentDate = new Date(year, month, dayOffset);
    return {
      key: formatDateKey(currentDate),
      day: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: formatDateKey(currentDate) === formatDateKey(new Date()),
    };
  });
}

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
  let calendarObservations: UpcomingObservation[] = [];
  let calendarDays: Array<{
    key: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];
  let todayLabel = "";
  let totalTeachers = 0;
  let observationsThisMonth = 0;
  let rppWaiting = 0;
  let completedCount = 0;
  let plansMap = new Map<string, Array<{ id: string; observation_id: string; file_name?: string | null; uploaded_at?: string | null }>>();

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

    // Fetch lesson plans for those upcoming observations so we can show RPP status
    const obsIds = upcomingObservations.map((o) => o.id);
    const plansMap = new Map<string, Array<{ id: string; observation_id: string; file_name?: string | null; uploaded_at?: string | null }>>();
    if (obsIds.length) {
      const { data: plans } = await supabase
        .from("lesson_plans")
        .select("id, observation_id, file_name, uploaded_at")
        .in("observation_id", obsIds);
      (plans ?? []).forEach((p: any) => {
        const arr = plansMap.get(p.observation_id) ?? [];
        arr.push(p);
        plansMap.set(p.observation_id, arr);
      });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartKey = formatDateKey(monthStart);
    const monthEndKey = formatDateKey(monthEnd);

    const { data: monthData } = await supabase
      .from("observations")
      .select(
        "id, observed_at, status, class_name, teacher:profiles!teacher_id(full_name, subject), teaching_roles(name)",
      )
      .eq("status", "terjadwal")
      .gte("observed_at", monthStartKey)
      .lte("observed_at", monthEndKey)
      .order("observed_at", { ascending: true });

    calendarObservations = (monthData ?? []) as UpcomingObservation[];
    calendarDays = getCalendarDays(now);
    todayLabel = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    // Metrics for dashboard cards
    const { data: teachers } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "guru");
    totalTeachers = (teachers ?? []).length;

    const { data: obsMonth } = await supabase
      .from("observations")
      .select("id")
      .gte("observed_at", monthStartKey)
      .lte("observed_at", monthEndKey);
    observationsThisMonth = (obsMonth ?? []).length;

    const { data: lessonPlans } = await supabase
      .from("lesson_plans")
      .select("id");
    rppWaiting = (lessonPlans ?? []).length;

    // Progress: count completed observations vs total scheduled this month
    const { data: completed } = await supabase
      .from("observations")
      .select("id")
      .eq("status", "selesai")
      .gte("observed_at", monthStartKey)
      .lte("observed_at", monthEndKey);
    completedCount = (completed ?? []).length;
  }

  return (
    <>
      <Sidebar />
      <main className="mx-auto max-w-3xl p-8 ml-0 md:ml-64">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action={logout}>
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Keluar
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-900 p-4 text-white">
          <p className="text-sm text-slate-300">Total guru</p>
          <p className="mt-2 text-2xl font-semibold">{totalTeachers}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4 text-white">
          <p className="text-sm text-slate-300">Observasi bulan ini</p>
          <p className="mt-2 text-2xl font-semibold">{observationsThisMonth}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4 text-white">
          <p className="text-sm text-slate-300">RPP menunggu review</p>
          <p className="mt-2 text-2xl font-semibold">{rppWaiting}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4 text-white">
          <p className="text-sm text-slate-300">Progress observasi</p>
          <p className="mt-2 text-2xl font-semibold">{completedCount}/{observationsThisMonth || 0}</p>
        </div>
      </div>

      {/* Top summaries: 3 nearest observations + RPP masuk */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold mb-3">Jadwal observasi — 3 terdekat</h3>
          {upcomingObservations.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada observasi terjadwal.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingObservations.slice(0, 3).map((o) => {
                const teacher = Array.isArray(o.teacher) ? o.teacher[0] : o.teacher;
                const role = Array.isArray(o.teaching_roles) ? o.teaching_roles[0] : o.teaching_roles;
                return (
                  <li key={o.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{teacher?.full_name ?? "—"}</p>
                      <p className="text-sm text-gray-500">{teacher?.subject ?? "—"} · {o.class_name ?? "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{new Date(o.observed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                      <p className="text-xs text-amber-700">{o.status}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold mb-3">RPP masuk — paling dekat</h3>
          {upcomingObservations.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada observasi terjadwal.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingObservations.slice(0, 5).map((o) => {
                const teacher = Array.isArray(o.teacher) ? o.teacher[0] : o.teacher;
                const plans = plansMap.get(o.id) ?? [];
                const uploaded = plans.length > 0;
                return (
                  <li key={o.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{teacher?.full_name ?? "—"}</p>
                      <p className="text-sm text-gray-500">{teacher?.subject ?? "—"} · {o.class_name ?? "-"}</p>
                    </div>
                    <div className="text-right">
                      {uploaded ? (
                        <p className="text-sm font-semibold text-green-700">
                          Sudah · {plans[0].uploaded_at ? new Date(plans[0].uploaded_at).toLocaleDateString("id-ID") : "Terunggah"}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-red-600">Belum</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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

          <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Hari ini</p>
            <p className="text-base font-semibold text-blue-900">{todayLabel}</p>
          </div>

          {upcomingObservations.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
              Belum ada observasi terjadwal untuk waktu dekat.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingObservations.map((o) => {
                const teacher = Array.isArray(o.teacher) ? o.teacher[0] : o.teacher;
                return (
                  <div key={o.id} className="rounded-lg border bg-slate-50 p-4">
                    <p className="font-medium">{teacher?.full_name ?? "—"}</p>
                    <p className="text-sm text-gray-500">
                      {teacher?.subject ?? "—"} · {o.class_name ?? "-"} · {new Date(o.observed_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
    </>
  );
}
