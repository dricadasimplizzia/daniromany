import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { requireProfile, ROLE_LABEL } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { Nav } from "@/components/shell/Nav";
import { Clock } from "@/components/shell/Clock";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center flex-wrap gap-2">
          <div>
            <h1 className="font-display text-[21px] m-0 text-ink tracking-wide">DANIELLA ROMANY</h1>
            <div className="text-xs text-ink-muted">
              {profile.nome} · {ROLE_LABEL[profile.role]}
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <Clock />
            <form action={signOut}>
              <button
                type="submit"
                className="bg-transparent border-none text-ink-muted cursor-pointer flex items-center gap-1 text-[13px]"
              >
                <LogOut size={14} /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <Nav role={profile.role} />

      <main className="max-w-[1100px] mx-auto px-5 pt-6 pb-16">{children}</main>
    </div>
  );
}
