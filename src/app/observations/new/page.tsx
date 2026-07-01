import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createObservation } from "./actions";

export default async function NewObservationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: teachers }, { data: rubrics }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, subject")
      .eq("role", "guru")
      .eq("status", "aktif")
      .order("full_name"),
    // Tugas yang sudah punya rubrik aktif = yang bisa diobservasi.
    supabase
      .from("rubrics")
      .select("teaching_role_id, teaching_roles(name)")
      .eq("is_active", true)
      .not("teaching_role_id", "is", null),
  ]);

  // Daftar tugas unik (value = teaching_role_id, label = nama tugas).
  const roleMap = new Map<string, string>();
  for (const r of rubrics ?? []) {
    const role = Array.isArray(r.teaching_roles)
      ? r.teaching_roles[0]
      : r.teaching_roles;
    if (r.teaching_role_id && role?.name) {
      roleMap.set(r.teaching_role_id, role.name);
    }
  }
  const roles = Array.from(roleMap, ([id, name]) => ({ id, name }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/observations" className="text-sm text-blue-600 hover:underline">
        ← Observasi
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">Buat Observasi</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={createObservation} className="space-y-4">
        <div>
          <label htmlFor="teacher_id" className="mb-1 block text-sm font-medium">
            Guru
          </label>
          <select
            id="teacher_id"
            name="teacher_id"
            required
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih guru —</option>
            {teachers?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} ({t.subject})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="teaching_role_id" className="mb-1 block text-sm font-medium">
            Dinilai sebagai (tugas)
          </label>
          <select
            id="teaching_role_id"
            name="teaching_role_id"
            required
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih tugas —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Rubrik akan mengikuti tugas yang dipilih.
          </p>
        </div>

        <div>
          <label htmlFor="observed_at" className="mb-1 block text-sm font-medium">
            Tanggal observasi
          </label>
          <input
            id="observed_at"
            name="observed_at"
            type="date"
            defaultValue={today}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="class_name" className="mb-1 block text-sm font-medium">
            Kelas (opsional)
          </label>
          <input
            id="class_name"
            name="class_name"
            type="text"
            placeholder="mis. 7A"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Lanjut isi penilaian →
        </button>
      </form>
    </main>
  );
}
