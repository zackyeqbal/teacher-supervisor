import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

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

type CalendarObservation = {
  id: string;
  observed_at: string;
  status: string;
  class_name: string | null;
  teacher: Array<{ full_name: string | null; subject: string | null }> | null;
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStartKey = formatDateKey(monthStart);
  const monthEndKey = formatDateKey(monthEnd);

  const { data: observations } = await supabase
    .from("observations")
    .select(
      "id, observed_at, status, class_name, teacher:profiles!teacher_id(full_name, subject)",
    )
    .gte("observed_at", monthStartKey)
    .lte("observed_at", monthEndKey)
    .order("observed_at", { ascending: true });

  const calendarDays = getCalendarDays(now);
  const monthlyObservations = (observations ?? []) as CalendarObservation[];

  return (
    <>
      <Sidebar />
      <main className="mx-auto max-w-3xl p-8 ml-0 md:ml-64">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-semibold">Kalender Observasi</h1>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Kalender Bulanan</h2>
              <p className="text-sm text-gray-500">
                Lihat jadwal observasi bulan ini dalam format kalender.
              </p>
            </div>
            <p className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              {now.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="mb-6 overflow-hidden rounded-lg border">
            <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                <div key={day} className="border-r px-2 py-2 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-white">
              {calendarDays.map((day) => {
                const dayObservations = monthlyObservations.filter(
                  (item) => item.observed_at.slice(0, 10) === day.key,
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
                        const time = observation.observed_at.length > 10
                          ? new Date(observation.observed_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : null;
                        return (
                          <p key={observation.id} className="truncate text-[10px] leading-4 text-slate-700">
                            {teacher?.full_name ?? "—"}
                            {time ? <span className="ml-1 text-[10px] text-slate-500">· {time}</span> : null}
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

          <div>
            <h3 className="mb-3 text-base font-semibold">Daftar Observasi Bulan Ini</h3>
            {monthlyObservations.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
                Belum ada observasi terjadwal di bulan ini.
              </p>
            ) : (
              <ul className="space-y-3">
                {monthlyObservations.map((observation) => {
                  const teacher = Array.isArray(observation.teacher)
                    ? observation.teacher[0]
                    : observation.teacher;
                  return (
                    <li key={observation.id} className="rounded-lg border bg-slate-50 p-4">
                      <p className="font-medium">{teacher?.full_name ?? "—"}</p>
                      <p className="text-sm text-gray-500">
                        {teacher?.subject ?? "—"} · {observation.class_name ?? "-"} · {new Date(observation.observed_at).toLocaleDateString("id-ID")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
