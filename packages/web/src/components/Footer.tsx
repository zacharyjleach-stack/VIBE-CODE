import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="font-semibold text-[var(--text)] tracking-tight">Aegis</span>
            </div>
            <p className="text-sm text-[var(--text-subtle)] leading-relaxed">
              The universal bridge for AI coding agents. Sync Cursor, Claude, and Gemini in real time.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="text-[var(--text)] font-medium mb-3">Product</p>
              <div className="space-y-2">
                <Link href="/billing" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Pricing</Link>
                <Link href="/changelog" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Changelog</Link>
                <Link href="/docs" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Docs</Link>
              </div>
            </div>
            <div>
              <p className="text-[var(--text)] font-medium mb-3">Resources</p>
              <div className="space-y-2">
                <Link href="https://github.com/aegis" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">GitHub</Link>
                <Link href="https://twitter.com/aegis" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Twitter</Link>
                <Link href="/blog" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Blog</Link>
              </div>
            </div>
            <div>
              <p className="text-[var(--text)] font-medium mb-3">Legal</p>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Privacy</Link>
                <Link href="/terms" className="block text-[var(--text-muted)] hover:text-[var(--text)] transition">Terms</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-subtle)]">
            © 2026 Aegis Technologies Ltd. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-subtle)]">
            The Universal Agentic Bridge
          </p>
        </div>
      </div>
    </footer>
  );
}
