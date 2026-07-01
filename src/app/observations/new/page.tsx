import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewObservationForm, type GuruOption } from "./form";

export default async function NewObservationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: profiles }, { data: teacherRoles }, { data: rubrics }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, subject")
        .eq("role", "guru")
        .eq("status", "aktif")
        .order("full_name"),
      supabase
        .from("teacher_roles")
        .select("teacher_id, teaching_role_id, teaching_roles(name)"),
      supabase
        .from("rubrics")
        .select("teaching_role_id")
        .eq("is_active", true)
        .not("teaching_role_id", "is", null),
    ]);

  // Tugas yang punya rubrik aktif = yang bisa diobservasi.
  const rubricRoleIds = new Set(
    (rubrics ?? []).map((r) => r.teaching_role_id),
  );

  // Kelompokkan tugas per guru (hanya yang punya rubrik).
  const rolesByTeacher = new Map<string, { id: string; name: string }[]>();
  for (const tr of teacherRoles ?? []) {
    if (!tr.teaching_role_id || !rubricRoleIds.has(tr.teaching_role_id)) continue;
    const role = Array.isArray(tr.teaching_roles)
      ? tr.teaching_roles[0]
      : tr.teaching_roles;
    if (!role?.name) continue;
    const arr = rolesByTeacher.get(tr.teacher_id) ?? [];
    arr.push({ id: tr.teaching_role_id, name: role.name });
    rolesByTeacher.set(tr.teacher_id, arr);
  }

  const guruOptions: GuruOption[] = (profiles ?? []).map((p) => ({
    id: p.id,
    label: `${p.full_name ?? "(tanpa nama)"}${p.subject ? ` (${p.subject})` : ""}`,
    roles: (rolesByTeacher.get(p.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/observations" className="text-sm text-blue-600 hover:underline">
        ← Observasi
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">Buat Observasi</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <NewObservationForm guruOptions={guruOptions} today={today} />
    </main>
  );
}
