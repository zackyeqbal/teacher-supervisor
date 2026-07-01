"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createObservation(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const teacher_id = formData.get("teacher_id") as string;
  const teaching_role_id = formData.get("teaching_role_id") as string;
  const observed_at = formData.get("observed_at") as string;
  const class_name = formData.get("class_name") as string;

  const fail = (msg: string) =>
    redirect(`/observations/new?error=${encodeURIComponent(msg)}`);

  // Pastikan guru memang mengemban tugas ini.
  const { count: roleCount } = await supabase
    .from("teacher_roles")
    .select("teacher_id", { count: "exact", head: true })
    .eq("teacher_id", teacher_id)
    .eq("teaching_role_id", teaching_role_id);

  if (!roleCount) {
    fail("Guru ini tidak mengemban tugas yang dipilih");
  }

  // Ambil rubrik aktif untuk tugas tsb.
  const { data: rubric } = await supabase
    .from("rubrics")
    .select("id")
    .eq("teaching_role_id", teaching_role_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rubric) {
    fail("Belum ada rubrik aktif untuk tugas ini");
  }

  const { data, error } = await supabase
    .from("observations")
    .insert({
      teacher_id,
      teaching_role_id,
      rubric_id: rubric!.id,
      supervisor_id: user.id,
      observed_at: observed_at || undefined,
      class_name: class_name || null,
      status: "terjadwal",
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/observations/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/observations");
  // Langsung ke form penilaian observasi yang baru dibuat.
  redirect(`/observations/${data.id}`);
}
