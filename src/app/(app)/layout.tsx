import { Header } from "@/components/layout/Header";
import { Shell } from "@/components/layout/Shell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Shell>{children}</Shell>
    </>
  );
}
