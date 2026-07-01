"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarClientProps = {
  userEmail: string;
  userRole: string;
};

export default function SidebarClient({ userEmail, userRole }: SidebarClientProps) {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/calendar", label: "Kalender" },
    { href: "/observations", label: "RPP & Nilai", matchPrefix: "/observations" },
    { href: "/statistics", label: "Statistik" },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 z-50">
      <div className="h-full overflow-auto bg-blue-600 p-6 text-white shadow-sm">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-100/80">Halo,</p>
          <p className="mt-2 text-lg font-semibold break-all text-white">{userEmail}</p>
          <p className="mt-1 text-sm text-blue-100/80">Role kamu:</p>
          <span className="mt-1 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-50">
            {userRole}
          </span>
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
