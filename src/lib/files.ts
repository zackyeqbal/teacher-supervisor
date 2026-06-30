// Tipe file RPP yang diizinkan.
export const ALLOWED_EXT = ["pdf", "doc", "docx", "xls", "xlsx"] as const;
export const MAX_FILE_MB = 10;

export function getExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isAllowedFile(name: string): boolean {
  return (ALLOWED_EXT as readonly string[]).includes(getExt(name));
}

// Bersihkan nama file agar aman dipakai sebagai path storage.
export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
