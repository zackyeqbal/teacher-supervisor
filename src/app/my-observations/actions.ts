"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAllowedFile, safeFileName, getExt, MAX_FILE_MB } from "@/lib/files";

const BUCKET = "lesson-plans";

export async function uploadLessonPlan(
  observationId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Pastikan user ini guru yang ditautkan & observasi memang miliknya.
  const { data: profile } = await supabase
    .from("profiles")
    .select("teacher_id")
    .eq("id", user.id)
    .single();

  if (!profile?.teacher_id) {
    redirect("/my-observations?error=Akun belum ditautkan ke data guru");
  }

  const { data: obs } = await supabase
    .from("observations")
    .select("id, teacher_id")
    .eq("id", observationId)
    .single();

  if (!obs || obs.teacher_id !== profile.teacher_id) {
    redirect("/my-observations?error=Observasi tidak ditemukan");
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/my-observations?error=File belum dipilih");
  }
  if (!isAllowedFile(file.name)) {
    redirect("/my-observations?error=Tipe file harus PDF, Word, atau Excel");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    redirect(`/my-observations?error=Ukuran file maksimal ${MAX_FILE_MB}MB`);
  }

  // Hapus file lama (kalau ada) supaya 1 observasi = 1 RPP terbaru.
  const { data: existing } = await supabase
    .from("lesson_plans")
    .select("id, file_path")
    .eq("observation_id", observationId);

  if (existing && existing.length > 0) {
    await supabase.storage.from(BUCKET).remove(existing.map((e) => e.file_path));
    await supabase
      .from("lesson_plans")
      .delete()
      .eq("observation_id", observationId);
  }

  // Upload ke storage.
  const path = `${observationId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });

  if (upErr) {
    redirect(`/my-observations?error=${encodeURIComponent(upErr.message)}`);
  }

  // Catat di tabel.
  const { error: rowErr } = await supabase.from("lesson_plans").insert({
    observation_id: observationId,
    teacher_id: profile.teacher_id,
    file_path: path,
    file_name: file.name,
    uploaded_by: user.id,
  });

  if (rowErr) {
    redirect(`/my-observations?error=${encodeURIComponent(rowErr.message)}`);
  }

  revalidatePath("/my-observations");
  redirect(`/my-observations?saved=${encodeURIComponent(file.name)}&ext=${getExt(file.name)}`);
}
