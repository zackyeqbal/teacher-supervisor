import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { scoreCategory } from "@/lib/score";

export default async function ObservationsPage() {
  const supabase = await createClient();

  // Ambil observasi + nama guru (lewat relasi teacher_id).
  const { data: observations } = await supabase
    .from("observations")
    .select("id, observed_at, status, final_score, class_name, teachers(full_name, subject)")
    .order("observed_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Observasi</h1>
        </div>
        <Link
          href="/observations/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Buat Observasi
        </Link>
      </div>

      {!observations || observations.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          Belum ada observasi. Klik &quot;Buat Observasi&quot; untuk mulai.
        </p>
      ) : (
        <ul className="space-y-2">
          {observations.map((o) => {
            // teachers bisa berupa objek atau array tergantung relasi — amankan.
            const teacher = Array.isArray(o.teachers) ? o.teachers[0] : o.teachers;
            const cat =
              o.final_score != null ? scoreCategory(Number(o.final_score)) : null;
            return (
              <li key={o.id}>
                <Link
                  href={`/observations/${o.id}`}
                  className="flex items-center justify-between rounded-lg border bg-white p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{teacher?.full_name ?? "—"}</p>
                    <p className="text-sm text-gray-500">
                      {teacher?.subject} · {o.class_name ?? "-"} ·{" "}
                      {new Date(o.observed_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    {o.status === "selesai" && o.final_score != null ? (
                      <>
                        <p className="text-lg font-semibold">{o.final_score}</p>
                        <p className="text-xs text-gray-500">{cat?.label}</p>
                      </>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {o.status}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
