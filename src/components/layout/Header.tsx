import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { SearchCommand } from "@/components/layout/SearchCommand";
import { HeaderCenterLabel } from "@/components/layout/HeaderCenterLabel";

export async function Header() {
  const user = await getSessionUser();
  const isLoggedIn = Boolean(user?.id);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(222,15,63,0.12),transparent_68%)]" />
      <div className="page-shell relative min-h-[120px] py-2 select-none">
        <div className="grid min-h-[120px] grid-cols-[1fr_auto_1fr] grid-rows-2 items-center gap-x-4">
          <div className="col-start-1 row-start-1 row-span-2 flex items-center justify-self-start">
            <SearchCommand />
          </div>

          <div className="col-start-2 row-start-1 row-span-2 flex flex-col items-center justify-center justify-self-center">
            <Link href="/" draggable={false} className="inline-flex items-center leading-none">
              <BrandLogo isLoggedIn={isLoggedIn} size={84} />
            </Link>
            {isLoggedIn ? (
              <HeaderCenterLabel username={user?.name} />
            ) : null}
          </div>

          <div className="col-start-3 row-start-1 row-span-2 flex items-center justify-self-end px-2.5">
            <HeaderNav username={user?.name} isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>
    </header>
  );
}
