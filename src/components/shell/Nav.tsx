"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/lib/nav";
import type { AppRole } from "@/lib/supabase/database.types";

export function Nav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-10 overflow-x-auto">
      <div className="max-w-[1100px] mx-auto flex gap-1 px-5">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-1.5 px-3.5 py-3.5 text-[13.5px] font-semibold whitespace-nowrap border-b-2 ${
                active ? "text-sage border-sage" : "text-ink-muted border-transparent"
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
