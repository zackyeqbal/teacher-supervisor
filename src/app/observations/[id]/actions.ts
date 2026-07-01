"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeFinalScore } from "@/lib/score";
import { RPP_REQUIRED_ROLE } from "@/lib/roles";

export async function saveScores(observationId: string, formData: FormData) {
  const supabase = await createClient();

  // Ambil observasi -> tahu rubrik & scale_max-nya.
  const { data: obs, error: obsErr } = await supabase
    .from("observations")
    .select("id, rubric_id, rubrics(scale_max), teaching_roles(name)")
    .eq("id", observationId)
    .single();

  if (obsErr || !obs) {
    redirect(`/observations/${observationId}?error=Observasi tidak ditemukan`);
  }

  const rubric = Array.isArray(obs.rubrics) ? obs.rubrics[0] : obs.rubrics;
  const scaleMax = rubric?.scale_max ?? 4;

  // RPP hanya diwajibkan untuk tugas "Guru Mata Pelajaran".
  const role = Array.isArray(obs.teaching_roles)
    ? obs.teaching_roles[0]
    : obs.teaching_roles;
  const needsLessonPlan = role?.name === RPP_REQUIRED_ROLE;

  if (needsLessonPlan) {
    // File RPP wajib ada sebelum penilaian boleh disimpan.
    const { count: planCount } = await supabase
      .from("lesson_plans")
      .select("id", { count: "exact", head: true })
      .eq("observation_id", observationId);

    if (!planCount || planCount === 0) {
      redirect(
        `/observations/${observationId}?error=${encodeURIComponent("Guru belum mengunggah RPP — penilaian belum bisa disimpan")}`,
      );
    }
  }

  // Ambil indikator rubrik (untuk bobot).
  const { data: items } = await supabase
    .from("rubric_items")
    .select("id, weight")
    .eq("rubric_id", obs.rubric_id);

  if (!items || items.length === 0) {
    redirect(`/observations/${observationId}?error=Rubrik tidak punya indikator`);
  }

  // Susun baris skor dari form + kumpulkan untuk perhitungan.
  const rows = [];
  const scored = [];
  for (const item of items) {
    const raw = formData.get(`score_${item.id}`);
    // Bedakan "belum diisi" (kosong) dari skor 0 yang valid.
    if (raw === null || raw === "") {
      redirect(
        `/observations/${observationId}?error=${encodeURIComponent("Semua indikator wajib diberi skor")}`,
      );
    }
    const score = Number(raw);
    if (Number.isNaN(score) || score < 0 || score > scaleMax) {
      redirect(
        `/observations/${observationId}?error=${encodeURIComponent("Skor tidak valid")}`,
      );
    }
    const note = (formData.get(`note_${item.id}`) as string) || null;
    rows.push({
      observation_id: observationId,
      rubric_item_id: item.id,
      score,
      note,
    });
    scored.push({ weight: Number(item.weight), score });
  }

  // Simpan skor (upsert: kalau sudah ada, diperbarui).
  const { error: scoreErr } = await supabase
    .from("observation_scores")
    .upsert(rows, { onConflict: "observation_id,rubric_item_id" });

  if (scoreErr) {
    redirect(`/observations/${observationId}?error=${encodeURIComponent(scoreErr.message)}`);
  }

  // Hitung skor akhir & tandai selesai.
  const finalScore = computeFinalScore(scored, scaleMax);
  await supabase
    .from("observations")
    .update({ final_score: finalScore, status: "selesai" })
    .eq("id", observationId);

  revalidatePath(`/observations/${observationId}`);
  revalidatePath("/observations");
  redirect(`/observations/${observationId}?saved=1`);
}
