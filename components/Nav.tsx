import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-4 text-sm">
        <Link href="/" className="font-semibold">Trace</Link>
        <Link href="/entries" className="hover:underline">Entries</Link>
        <Link href="/check-in" className="hover:underline">Check-in</Link>
        <Link href="/themes" className="hover:underline">Themes</Link>
        <div className="flex-1" />
        <Link href="/entries/new" className="rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-1 text-xs font-medium">New entry</Link>
      </div>
    </nav>
  );
}
