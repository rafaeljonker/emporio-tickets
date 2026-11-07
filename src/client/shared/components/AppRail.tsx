import Image from 'next/image';
import Link from 'next/link';

/** The walnut wood rail with the honey rule: the brand's navigation bar. */
export function AppRail() {
  return (
    <header className="surface-wood sticky top-0 z-10 border-b-[3px] border-rail-rule bg-rail text-rail-foreground">
      <div className="mx-auto flex max-w-[880px] items-center gap-3 px-4 py-2.5 md:px-6 md:py-3">
        <Link href="/" className="flex items-center gap-3 rounded-full focus-visible:outline-rail-foreground">
          <Image src="/avatar.jpg" alt="" width={40} height={40} className="size-[34px] rounded-full md:size-10" priority />
          <span className="leading-tight">
            <span className="block font-semibold">Empório da Música</span>
            <span className="block text-sm text-rail-muted">Team desk</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
