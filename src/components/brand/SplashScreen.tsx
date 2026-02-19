import Image from "next/image";
import Link from "next/link";

export function SplashScreen() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#08090b] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(222,15,63,0.18),transparent_62%)]" />

      <Link
        href="/explore"
        className="relative inline-flex cursor-pointer transition duration-200 hover:scale-[1.02] hover:brightness-110"
      >
        <Image
          src="/brand/8.png"
          alt="The Palumbers"
          width={1200}
          height={1200}
          priority
          className="h-auto w-[min(86vw,760px)] object-contain"
        />
      </Link>
    </div>
  );
}
