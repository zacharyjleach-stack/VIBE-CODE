import Link from 'next/link';
import { HeroSection } from '../components/HeroSection';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { PricingPreview } from '../components/PricingPreview';
import { Footer } from '../components/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[rgba(9,9,11,0.85)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <span className="font-semibold text-[var(--text)] tracking-tight">Aegis</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="#features" className="hover:text-[var(--text)] transition">Features</Link>
            <Link href="/billing" className="hover:text-[var(--text)] transition">Pricing</Link>
            <Link href="/docs" className="hover:text-[var(--text)] transition">Docs</Link>
            <Link href="/changelog" className="hover:text-[var(--text)] transition">Changelog</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden md:block text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-primary text-sm py-2 px-4">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <FeaturesGrid />
      <PricingPreview />
      <Footer />
    </main>
  );
}
