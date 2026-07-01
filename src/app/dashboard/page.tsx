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

          <div className="mb-5 overflow-hidden rounded-lg border">
            <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                <div key={day} className="border-r px-2 py-2 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-white">
              {calendarDays.map((day) => {
                const dayObservations = calendarObservations.filter(
                  (item) => item.observed_at === day.key,
                );

                return (
                  <div
                    key={day.key}
                    className={`min-h-24 border-r border-b p-2 text-sm last:border-r-0 ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                          day.isToday ? 'bg-blue-600 text-white' : ''
                        }`}
                      >
                        {day.day}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayObservations.slice(0, 2).map((observation) => {
                        const teacher = Array.isArray(observation.teacher)
                          ? observation.teacher[0]
                          : observation.teacher;
                        const raw = observation.observed_at ?? "";
                        const hasTime = raw.length > 10 && raw.includes(":");
                        const time = hasTime
                          ? new Date(raw).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : null;

                        return (
                          <p
                            key={observation.id}
                            className="truncate text-[10px] leading-4 text-slate-700"
                          >
                            {teacher?.full_name ?? "—"}
                            {time ? <span className="ml-1 text-[10px] text-slate-500"> · {time}</span> : null}
                          </p>
                        );
                      })}
                      {dayObservations.length > 2 && (
                        <p className="text-[10px] font-medium text-blue-600">
                          +{dayObservations.length - 2} lagi
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {upcomingObservations.length === 0 ? (
            <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-gray-500">
              Belum ada observasi terjadwal untuk waktu dekat.
            </p>
          ) : (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Jadwal terdekat
              </h3>
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
                            {teacher?.full_name ?? '—'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {role?.name && (
                              <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                                {role.name}
                              </span>
                            )}
                            {teacher?.subject ?? '—'} · {observation.class_name ?? '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(observation.observed_at).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
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
            </div>
          )}
        </section>
      )}
    </main>
    </>
  );
}
