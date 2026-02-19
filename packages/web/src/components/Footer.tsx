import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl text-[var(--accent)]">⬡</span>
            <span className="font-bold tracking-[0.2em] text-sm">AEGIS</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-[var(--text-dim)]">
            <Link href="/billing" className="hover:text-white transition">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition">Docs</Link>
            <Link href="https://github.com/aegis" className="hover:text-white transition">GitHub</Link>
            <Link href="https://twitter.com/aegis" className="hover:text-white transition">Twitter</Link>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-[var(--text-dim)]">
          © 2026 Aegis. The Universal Agentic Bridge.
        </div>
      </div>
    </footer>
  );
}
