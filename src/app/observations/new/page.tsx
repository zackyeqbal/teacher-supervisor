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
    supabase.from("teachers").select("id, full_name, subject").eq("status", "aktif").order("full_name"),
    supabase.from("rubrics").select("id, name").eq("is_active", true).order("name"),
  ]);

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
          <label htmlFor="rubric_id" className="mb-1 block text-sm font-medium">
            Rubrik
          </label>
          <select
            id="rubric_id"
            name="rubric_id"
            required
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih rubrik —</option>
            {rubrics?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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
