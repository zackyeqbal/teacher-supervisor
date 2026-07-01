// ============================================================
// Seed akun guru dari docs/List Guru.csv
//
// Untuk tiap guru:
//   - buat akun auth (email = <nama depan>.<nama belakang>@mtsn.cimahi.ac.id,
//     password default 123456, email langsung terkonfirmasi)
//   - isi profil (role 'guru', full_name, subject)
//   - tautkan ke tugas (teacher_roles): "Guru Mata Pelajaran" untuk guru mapel,
//     "Guru BK" untuk guru BP, plus tugas tambahan yang cocok.
//
// Idempoten: aman dijalankan ulang (akun/tautan yang sudah ada dilewati).
//
// Jalankan:
//   node scripts/seed-teachers.mjs
//
// PRASYARAT (di .env.local):
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...   <-- Project Settings > API > service_role (RAHASIA)
//   (schema.sql + seed.sql harus sudah dijalankan lebih dulu)
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---- Muat env dari .env.local ----
function loadEnv(path = ".env.local") {
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* file boleh tidak ada kalau env dari shell */
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "❌ Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local",
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "123456";
const DOMAIN = "mtsn.cimahi.ac.id";

// ---- Parser CSV sederhana (mendukung field ber-kutip) ----
function parseCSV(text) {
  text = text.replace(/^﻿/, "");
  const rows = [];
  let row = [],
    field = "",
    q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      /* skip */
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---- Email dari nama: buang gelar/inisial (token ber-titik) & gelar depan ----
function deriveEmailLocal(nama) {
  const titles = new Set(["dra", "drs", "dr", "h", "hj", "ir", "st"]);
  const tokens = nama
    .split(",")[0] // buang gelar setelah koma
    .trim()
    .split(/\s+/)
    .filter((t) => !t.includes(".")) // buang "S.Pd", "M.Pd", "D." dll
    .map((t) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]/g, ""),
    )
    .filter((t) => t.length > 1)
    .filter((t) => !titles.has(t));
  if (tokens.length === 0) return "guru";
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return first === last ? first : `${first}.${last}`;
}

// ---- Normalisasi tugas tambahan -> nama teaching_role ----
function normalizeDuty(d) {
  const s = (d || "").trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("wali kelas")) return "Wali Kelas";
  if (s === "piket") return "Guru Piket";
  if (s.startsWith("pembina pramuka")) return "Pembina Pramuka";
  if (s.startsWith("pembina osis")) return "Pembina OSIS";
  if (s.startsWith("pembina uks")) return "Pembina UKS";
  if (s.startsWith("wakil kepala sarana")) return "Wakil Kepala Sarana";
  if (s.startsWith("wakil kepala kurikulum")) return "Wakil Kepala Kurikulum";
  if (s.startsWith("wakil kepala kesiswaan")) return "Wakil Kepala Kesiswaan";
  if (s.startsWith("wakil kepala humas") || s.startsWith("wakil kepala hubungan"))
    return "Wakil Kepala Hubungan Masyarakat";
  if (s.startsWith("kepala perpustakaan")) return "Kepala Perpustakaan";
  if (s.startsWith("lab komputer") || s.startsWith("kepala lab")) return "Kepala Lab";
  return null; // tak ada padanan (Kepala Madrasah, Koord. PKB, PLH) -> dilewati
}

// ---- Main ----
const csv = parseCSV(readFileSync("docs/List Guru.csv", "utf8"));
const header = csv[0];
const idx = (name) => header.indexOf(name);
const iNama = idx("Nama");
const iM1 = idx("Mata Pelajaran Ke-1");
const iM2 = idx("Mata Pelajaran Ke-2");
const iT1 = idx("Tugas Tambahan");
const iT2 = idx("Tugas Tambahan Ke-2");

// Peta teaching_roles: name -> id
const { data: roles, error: rolesErr } = await supabase
  .from("teaching_roles")
  .select("id, name");
if (rolesErr || !roles?.length) {
  console.error("❌ teaching_roles kosong — jalankan schema.sql + seed.sql dulu.");
  process.exit(1);
}
const roleId = (name) => roles.find((r) => r.name === name)?.id;

const usedEmails = new Set();
const unmappedDuties = new Set();
const summary = [];

for (const row of csv.slice(1)) {
  if (!row[iNama] || !row[iNama].trim()) continue;
  const nama = row[iNama].trim();
  const mapel1 = (row[iM1] || "").trim();
  const mapel2 = (row[iM2] || "").trim();
  const isBP = mapel1.toUpperCase() === "BP";
  const subject = [mapel1, mapel2].filter(Boolean).join(" / ") || null;

  // Email unik
  let local = deriveEmailLocal(nama);
  let email = `${local}@${DOMAIN}`;
  let n = 2;
  while (usedEmails.has(email)) email = `${local}${n++}@${DOMAIN}`;
  usedEmails.add(email);

  // Tugas yang ditautkan
  const roleNames = new Set([isBP ? "Guru BK" : "Guru Mata Pelajaran"]);
  for (const d of [row[iT1], row[iT2]]) {
    const norm = normalizeDuty(d);
    if (norm) roleNames.add(norm);
    else if ((d || "").trim()) unmappedDuties.add((d || "").trim());
  }

  // 1) Buat akun (atau ambil id kalau sudah ada)
  let userId;
  const { data: created, error: cErr } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: nama },
  });
  if (cErr) {
    if (/registered|already|exist|duplicate/i.test(cErr.message)) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      userId = prof?.id;
    }
    if (!userId) {
      console.warn(`⚠️  gagal: ${nama} <${email}> — ${cErr.message}`);
      continue;
    }
  } else {
    userId = created.user.id;
  }

  // 2) Lengkapi profil (baris dibuat otomatis oleh trigger)
  await supabase
    .from("profiles")
    .update({ role: "guru", full_name: nama, subject, status: "aktif" })
    .eq("id", userId);

  // 3) Tautkan tugas
  const roleRows = [...roleNames]
    .map((rn) => roleId(rn))
    .filter(Boolean)
    .map((rid) => ({ teacher_id: userId, teaching_role_id: rid }));
  if (roleRows.length) {
    await supabase
      .from("teacher_roles")
      .upsert(roleRows, {
        onConflict: "teacher_id,teaching_role_id",
        ignoreDuplicates: true,
      });
  }

  summary.push({ nama, email, tugas: [...roleNames].join(", ") });
  console.log(`✓ ${email.padEnd(38)} ${[...roleNames].join(", ")}`);
}

// Tulis daftar kredensial untuk referensi
const outCsv =
  "Nama,Email,Password,Tugas\n" +
  summary
    .map((s) => `"${s.nama}",${s.email},${PASSWORD},"${s.tugas}"`)
    .join("\n");
writeFileSync("docs/akun-guru.generated.csv", outCsv, "utf8");

console.log(`\n✅ Selesai. ${summary.length} akun diproses.`);
console.log("   Daftar login: docs/akun-guru.generated.csv");
if (unmappedDuties.size) {
  console.log(
    `\nℹ️  Tugas tanpa padanan teaching_role (dilewati): ${[...unmappedDuties].join(", ")}`,
  );
}
