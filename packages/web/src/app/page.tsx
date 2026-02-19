import Link from 'next/link';
import { HeroSection } from '../components/HeroSection';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { PricingPreview } from '../components/PricingPreview';
import { Footer } from '../components/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-[var(--accent)]">⬡</span>
            <span className="font-bold tracking-[0.3em] text-sm">AEGIS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/billing" className="text-sm text-[var(--text-dim)] hover:text-white transition">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm text-[var(--text-dim)] hover:text-white transition">
              Dashboard
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-[var(--accent)] rounded-lg text-sm font-semibold hover:opacity-90 transition"
            >
              Get Started
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
