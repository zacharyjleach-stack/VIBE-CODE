Add file upload functionality with drag-and-drop, preview, and cloud storage.

What to build: $ARGUMENTS

**Install:**
```bash
npm install uploadthing @uploadthing/react
# OR for direct S3:
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**UploadThing setup (easiest — handles S3 automatically):**

1. Get keys from uploadthing.com, add to .env:
```env
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
```

2. Core config (app/api/uploadthing/core.ts):
```ts
import { createUploadthing, type FileRouter } from 'uploadthing/next';
const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      const user = await auth(); // your auth
      if (!user) throw new Error('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete', file.url);
      return { url: file.url };
    }),

  documentUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(async () => ({ userId: 'user' }))
    .onUploadComplete(async ({ file }) => ({ url: file.url })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

3. Route handler (app/api/uploadthing/route.ts):
```ts
import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';
export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
```

**Drag-and-drop upload component:**
```tsx
'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone'; // npm install react-dropzone
import { UploadCloud, X, Check } from 'lucide-react';

export function FileUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Local preview for images
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    onUpload(url);
    setUploading(false);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-[#7C6AFF] bg-[#7C6AFF]/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl" />
      ) : (
        <>
          <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-[#7C6AFF]' : 'text-[#8E8E96]'}`} />
          <p className="text-white font-medium mb-1">
            {isDragActive ? 'Drop to upload' : 'Drag & drop files here'}
          </p>
          <p className="text-[#8E8E96] text-sm">or click to browse · Max 10MB</p>
        </>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7C6AFF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
```

**Direct S3 presigned URL upload:**
```ts
// app/api/upload/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: Request) {
  const { filename, contentType } = await req.json();
  const key = `uploads/${Date.now()}-${filename}`;

  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 60 });

  return Response.json({ url, key });
}
```

Build the specific upload feature with progress tracking and error handling.
