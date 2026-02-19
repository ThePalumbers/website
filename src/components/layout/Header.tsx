import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { SearchCommand } from "@/components/layout/SearchCommand";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(222,15,63,0.12),transparent_68%)]" />
      <div className="page-shell relative grid h-[100px] select-none grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="justify-self-start">
          <Link href="/explore" draggable={false} className="inline-flex items-center gap-2">
            <SearchCommand />
          </Link>
        </div>

        <div className="justify-self-center">
          <Link href="/" draggable={false} className="inline-flex items-center">
            <BrandLogo />
          </Link>
        </div>

        <div className="justify-self-end">
          <HeaderNav username={user?.name} />
        </div>
      </div>
    </header>
  );
}
