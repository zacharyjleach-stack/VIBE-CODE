Add comprehensive SEO optimisation to the specified page or the entire app.

Target: $ARGUMENTS

Read the existing metadata setup first, then implement:

1. **Metadata API** (Next.js 14 App Router):
   - Title template: "Page Name | Aegis"
   - Unique description (150-160 chars) per page
   - keywords, authors, robots metadata

2. **Open Graph tags** for social sharing:
   - og:title, og:description, og:image (1200x630px reference)
   - og:type (website for homepage, article for blog)
   - og:url with metadataBase set

3. **Twitter Card tags**:
   - twitter:card = "summary_large_image"
   - twitter:title, twitter:description, twitter:image

4. **Structured Data** (JSON-LD) where appropriate:
   - Organization schema on homepage
   - Product schema on pricing page
   - SoftwareApplication schema for the app

5. **Technical SEO**:
   - canonical URLs
   - robots.txt if missing
   - sitemap.ts if missing
   - Ensure no noindex on public pages

Show a preview of how the page will appear when shared on Twitter/LinkedIn.
