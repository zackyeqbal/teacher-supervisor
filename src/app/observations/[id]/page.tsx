import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreCategory } from "@/lib/score";
import { saveScores } from "./actions";

export default async function ObservationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const { data: obs } = await supabase
    .from("observations")
    .select(
      "id, observed_at, class_name, status, final_score, general_notes, rubric_id, teacher:profiles!teacher_id(full_name, subject), rubrics(name, scale_max), teaching_roles(name)",
    )
    .eq("id", id)
    .single();

  if (!obs) notFound();

  const teacher = Array.isArray(obs.teacher) ? obs.teacher[0] : obs.teacher;
  const rubric = Array.isArray(obs.rubrics) ? obs.rubrics[0] : obs.rubrics;
  const role = Array.isArray(obs.teaching_roles)
    ? obs.teaching_roles[0]
    : obs.teaching_roles;
  const scaleMax = rubric?.scale_max ?? 4;

  // Indikator + skor yang sudah ada (kalau pernah disimpan) + file RPP.
  const [{ data: items }, { data: existing }, { data: plan }] = await Promise.all([
    supabase
      .from("rubric_items")
      .select("id, category, indicator, weight, sort_order")
      .eq("rubric_id", obs.rubric_id)
      .order("sort_order"),
    supabase
      .from("observation_scores")
      .select("rubric_item_id, score, note")
      .eq("observation_id", id),
    supabase
      .from("lesson_plans")
      .select("file_path, file_name")
      .eq("observation_id", id)
      .maybeSingle(),
  ]);

  // Link download file RPP (signed URL, berlaku 1 jam).
  let fileUrl: string | null = null;
  if (plan?.file_path) {
    const { data: signed } = await supabase.storage
      .from("lesson-plans")
      .createSignedUrl(plan.file_path, 3600);
    fileUrl = signed?.signedUrl ?? null;
  }

  const scoreByItem = new Map(
    (existing ?? []).map((s) => [s.rubric_item_id, s]),
  );

  // Kelompokkan indikator per kategori.
  const categories: Record<string, typeof items> = {};
  for (const it of items ?? []) {
    (categories[it.category] ??= []).push(it);
  }

  const cat = obs.final_score != null ? scoreCategory(Number(obs.final_score)) : null;
  const saveWithId = saveScores.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/observations" className="text-sm text-blue-600 hover:underline">
        ← Observasi
      </Link>

      <div className="mb-6 mt-1 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{teacher?.full_name}</h1>
          <p className="text-sm text-gray-500">
            {teacher?.subject} · {obs.class_name ?? "-"} ·{" "}
            {new Date(obs.observed_at).toLocaleDateString("id-ID")}
          </p>
          {role?.name && (
            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {role.name}
            </span>
          )}
          <p className="mt-1 text-xs text-gray-400">{rubric?.name}</p>
        </div>
        {obs.status === "selesai" && obs.final_score != null && (
          <div className="text-right">
            <p className="text-3xl font-bold">{obs.final_score}</p>
            <p className="text-sm font-medium text-gray-600">{cat?.label}</p>
          </div>
        )}
      </div>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ Penilaian tersimpan. Skor akhir: {obs.final_score}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* File rencana pembelajaran dari guru */}
      <div className="mb-6 rounded-lg border p-4">
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Rencana Pembelajaran (RPP)
        </p>
        {plan ? (
          <a
            href={fileUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            📎 {plan.file_name} — unduh
          </a>
        ) : (
          <p className="text-sm text-red-600">
            ⚠️ Guru belum mengunggah file RPP. Penilaian belum bisa disimpan
            sampai file diunggah.
          </p>
        )}
      </div>

      <form action={saveWithId} className="space-y-6">
        {Object.entries(categories).map(([category, catItems]) => (
          <fieldset key={category} className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700">
              {category}
            </legend>
            <div className="space-y-4">
              {(catItems ?? []).map((it) => {
                const prev = scoreByItem.get(it.id);
                return (
                  <div key={it.id}>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm">
                        {it.indicator}{" "}
                        <span className="text-xs text-gray-400">(bobot {it.weight})</span>
                      </label>
                      <select
                        name={`score_${it.id}`}
                        defaultValue={prev?.score ?? ""}
                        required
                        className="w-16 rounded-md border bg-white px-2 py-1 text-sm"
                      >
                        <option value="">—</option>
                        {Array.from({ length: scaleMax + 1 }, (_, i) => i).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      name={`note_${it.id}`}
                      defaultValue={prev?.note ?? ""}
                      placeholder="catatan (opsional)"
                      className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Skala skor: 0–{scaleMax}</p>
          <button
            disabled={!plan}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Simpan & hitung skor
          </button>
        </div>
      </form>
    </main>
  );
}
