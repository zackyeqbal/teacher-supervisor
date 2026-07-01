"use client";

import { useEffect, useRef, useState } from "react";
import { createObservation } from "./actions";

export type GuruOption = {
  id: string;
  label: string;
  roles: { id: string; name: string }[];
};

export function NewObservationForm({
  guruOptions,
  today,
}: {
  guruOptions: GuruOption[];
  today: string;
}) {
  const [teacherId, setTeacherId] = useState("");
  const selectRef = useRef<HTMLSelectElement>(null);
  const selected = guruOptions.find((g) => g.id === teacherId);
  const roles = selected?.roles ?? [];

  // Sinkronkan kalau browser me-restore pilihan guru saat reload
  // (native select bisa punya nilai tanpa memicu onChange).
  useEffect(() => {
    const restored = selectRef.current?.value;
    if (restored) setTeacherId(restored);
  }, []);

  return (
    <form action={createObservation} className="space-y-4" autoComplete="off">
      <div>
        <label htmlFor="teacher_id" className="mb-1 block text-sm font-medium">
          Guru
        </label>
        <select
          id="teacher_id"
          name="teacher_id"
          ref={selectRef}
          required
          defaultValue=""
          onChange={(e) => setTeacherId(e.target.value)}
          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
        >
          <option value="">— Pilih guru —</option>
          {guruOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="teaching_role_id" className="mb-1 block text-sm font-medium">
          Dinilai sebagai (tugas)
        </label>
        {/* key=teacherId -> reset pilihan tiap ganti guru */}
        <select
          key={teacherId}
          id="teaching_role_id"
          name="teaching_role_id"
          required
          disabled={!teacherId || roles.length === 0}
          className="w-full rounded-md border bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">
            {!teacherId ? "— Pilih guru dulu —" : "— Pilih tugas —"}
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {teacherId && roles.length === 0 ? (
          <p className="mt-1 text-xs text-red-600">
            Guru ini belum punya tugas dengan rubrik aktif.
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-400">
            Hanya tugas yang diemban guru ini yang muncul. Rubrik mengikuti tugas.
          </p>
        )}
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
  );
}
