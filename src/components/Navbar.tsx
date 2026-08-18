import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Avatar } from "@/components/Avatar";

export function Navbar({
  displayName,
  username,
  verified,
  avatarUrl,
  initials,
}: {
  displayName: string;
  username: string;
  verified: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
}) {
  return (
    <header
      className="sticky top-0 z-10 border-b"
      style={{ background: "var(--blue-deep)", borderColor: "var(--blue-deep)" }}
    >
      <div className="max-w-4xl mx-auto flex items-center gap-4 px-4 py-3 flex-wrap">
        <Link href="/feed" className="logo-mark">
          <span className="ork">ork</span>
          <span className="up">UP</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1 flex-wrap">
          <NavLink href="/feed">Início</NavLink>
          <NavLink href="/comunidades">Comunidades</NavLink>
          <NavLink href={`/perfil/${username}`}>Perfil</NavLink>
        </nav>

        <div className="flex items-center gap-2 text-white text-sm">
          <Avatar avatarUrl={avatarUrl} initials={initials} size={28} />
          <span>
            {displayName}
            {verified && <span className="verified-badge" title="Perfil verificado">✓</span>}
          </span>
          <form action={signOut}>
            <button type="submit" className="btn-logout">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-white/90 hover:text-white text-sm font-medium px-3 py-2 rounded-full hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
