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
  const rubric_id = formData.get("rubric_id") as string;
  const observed_at = formData.get("observed_at") as string;
  const class_name = formData.get("class_name") as string;

  const { data, error } = await supabase
    .from("observations")
    .insert({
      teacher_id,
      rubric_id,
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
