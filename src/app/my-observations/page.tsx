import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { uploadLessonPlan } from "./actions";
import { ALLOWED_EXT, MAX_FILE_MB } from "@/lib/files";
import { RPP_REQUIRED_ROLE } from "@/lib/roles";

export default async function MyObservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guru = profilnya sendiri; observasi miliknya = teacher_id sama dengan id user.
  const { data: observations } = await supabase
    .from("observations")
    .select(
      "id, observed_at, status, class_name, rubrics(name), teaching_roles(name), lesson_plans(id, file_name)",
    )
    .eq("teacher_id", user!.id)
    .order("observed_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mb-1 mt-1 text-2xl font-semibold">Observasi Saya</h1>
      <p className="mb-6 text-sm text-gray-500">
        Unggah rencana pembelajaran (RPP) untuk tiap jadwal observasi.
      </p>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ File &quot;{saved}&quot; berhasil diunggah.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!observations || observations.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          Belum ada jadwal observasi untukmu.
        </p>
      ) : (
        <ul className="space-y-3">
          {observations.map((o) => {
            const rubric = Array.isArray(o.rubrics) ? o.rubrics[0] : o.rubrics;
            const role = Array.isArray(o.teaching_roles)
              ? o.teaching_roles[0]
              : o.teaching_roles;
            const plan = Array.isArray(o.lesson_plans)
              ? o.lesson_plans[0]
              : o.lesson_plans;
            const rppRequired = role?.name === RPP_REQUIRED_ROLE;
            const uploadWithId = uploadLessonPlan.bind(null, o.id);
            return (
              <li key={o.id} className="rounded-lg border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {new Date(o.observed_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {role?.name ? `${role.name} · ` : ""}
                      {rubric?.name} · {o.class_name ?? "-"}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      o.status === "selesai"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                {plan ? (
                  <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    📎 File terunggah: <span className="font-medium">{plan.file_name}</span>
                  </p>
                ) : rppRequired ? (
                  <p className="mb-2 text-sm text-red-600">Belum ada file RPP.</p>
                ) : (
                  <p className="mb-2 text-sm text-gray-400">
                    RPP opsional untuk tugas ini.
                  </p>
                )}

                <form action={uploadWithId} className="mt-2 flex items-center gap-2">
                  <input
                    type="file"
                    name="file"
                    required
                    accept={ALLOWED_EXT.map((e) => "." + e).join(",")}
                    className="flex-1 text-sm file:mr-2 file:rounded-md file:border file:bg-gray-50 file:px-3 file:py-1 file:text-sm"
                  />
                  <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                    {plan ? "Ganti" : "Unggah"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Format: {ALLOWED_EXT.join(", ").toUpperCase()} · maks {MAX_FILE_MB}MB
      </p>
    </main>
  );
}
