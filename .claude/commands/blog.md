Add a blog or content section with MDX and CMS support.

What to build: $ARGUMENTS

**Install:**
```bash
npm install next-mdx-remote gray-matter reading-time
```

**File-based MDX blog:**
```
content/
  blog/
    my-first-post.mdx
    building-with-aegis.mdx
```

**Frontmatter schema:**
```mdx
---
title: "Building with Aegis"
description: "How Aegis changed the way I work with AI tools"
date: "2024-03-15"
author: "Sarah Chen"
image: "/blog/aegis-cover.jpg"
tags: ["ai", "developer-tools"]
---

Your MDX content here...
```

**lib/blog.ts:**
```ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.join(process.cwd(), 'content/blog');

export function getAllPosts() {
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(filename => {
      const slug = filename.replace('.mdx', '');
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug,
        ...data,
        readingTime: readingTime(content).text,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPost(slug: string) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), 'utf8');
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}
```

**Blog index page (app/blog/page.tsx):**
```tsx
import { getAllPosts } from '@/lib/blog';

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
      <p className="text-[#8E8E96] mb-16">Thoughts on AI, developer tools, and building the future.</p>
      <div className="space-y-12">
        {posts.map(post => (
          <article key={post.slug}>
            <a href={`/blog/${post.slug}`} className="group block">
              {post.image && (
                <img src={post.image} alt={post.title} className="w-full aspect-video object-cover rounded-xl mb-6 opacity-80 group-hover:opacity-100 transition" />
              )}
              <div className="flex gap-3 mb-3">
                {post.tags?.map(tag => (
                  <span key={tag} className="text-xs text-[#7C6AFF] bg-[#7C6AFF]/10 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-[#7C6AFF] transition">{post.title}</h2>
              <p className="text-[#8E8E96] mb-3">{post.description}</p>
              <span className="text-xs text-[#8E8E96]">{post.date} · {post.readingTime}</span>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
```

**Individual post page (app/blog/[slug]/page.tsx):**
```tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getPost } from '@/lib/blog';

export default async function PostPage({ params }) {
  const { frontmatter, content } = await getPost(params.slug);
  return (
    <article className="max-w-3xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">{frontmatter.title}</h1>
      <div className="prose prose-invert prose-purple max-w-none">
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
```

**Add Tailwind prose plugin:**
```bash
npm install @tailwindcss/typography
```
```js
// tailwind.config.js
plugins: [require('@tailwindcss/typography')]
```

Build the specific blog feature or content page requested.
