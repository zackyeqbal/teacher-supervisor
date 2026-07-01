"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ full_name?: string | null; role?: string | null } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      if (data.user) {
        supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profileData }) => {
            setProfile(profileData ?? null);
          });
      }
    });
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/calendar", label: "Kalender" },
    { href: "/observations", label: "RPP & Nilai", matchPrefix: "/observations" },
    { href: "/statistics", label: "Statistik" },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 z-50">
      <div className="h-full overflow-auto bg-blue-600 p-6 text-white shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-800 text-lg font-semibold">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <div className="font-semibold">{profile?.full_name ?? userEmail ?? "User"}</div>
            <div className="text-xs text-blue-200">{profile?.role ?? "—"}</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = item.matchPrefix
              ? pathname.startsWith(item.matchPrefix)
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 transition ${
                  active
                    ? "bg-blue-100 text-slate-900"
                    : "text-white hover:bg-blue-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
