import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function trimEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** True when all required vars are set for uploads + public URLs. */
export function isR2Configured(): boolean {
  return Boolean(
    trimEnv("R2_ACCOUNT_ID") &&
      trimEnv("R2_ACCESS_KEY_ID") &&
      trimEnv("R2_SECRET_ACCESS_KEY") &&
      trimEnv("R2_BUCKET_NAME") &&
      trimEnv("R2_PUBLIC_BASE_URL"),
  );
}

function createClient(): S3Client {
  const accountId = trimEnv("R2_ACCOUNT_ID")!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: trimEnv("R2_ACCESS_KEY_ID")!,
      secretAccessKey: trimEnv("R2_SECRET_ACCESS_KEY")!,
    },
  });
}

/** Full HTTPS URL for an object key (bucket must be exposed via this base URL). */
export function publicUrlForPortfolioKey(key: string): string {
  const base = trimEnv("R2_PUBLIC_BASE_URL")!.replace(/\/$/, "");
  const k = key.replace(/^\//, "");
  return `${base}/${k.split("/").map(encodeURIComponent).join("/")}`;
}

/** Prefer matching stored URLs to `R2_PUBLIC_BASE_URL`; falls back to pathname-only keys under `items/`. */
export function tryExtractR2KeyFromPublicUrl(url: string): string | null {
  const base = trimEnv("R2_PUBLIC_BASE_URL")?.replace(/\/$/, "");
  if (base && url.startsWith(base)) {
    const rest = url.slice(base.length).replace(/^\//, "");
    if (!rest) {
      return null;
    }
    return decodeURIComponent(rest.split("?")[0]!);
  }
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, "");
    if (path.startsWith("items/")) {
      return decodeURIComponent(path.split("?")[0]!);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function r2PutPortfolioObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const client = createClient();
  const bucket = trimEnv("R2_BUCKET_NAME")!;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function r2DeleteKeys(keys: string[]): Promise<void> {
  if (!keys.length) {
    return;
  }
  const client = createClient();
  const bucket = trimEnv("R2_BUCKET_NAME")!;
  const chunkSize = 1000;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}
