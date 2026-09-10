import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { env } from "../config/env";

const s3 = new S3Client({
  region: env.s3.region || "auto",
  endpoint: env.s3.endpoint || undefined,
  credentials: env.s3.accessKeyId
    ? { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey }
    : undefined,
});

export function buildStorageKey(originalFileName: string): string {
  const safeName = originalFileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
}

/**
 * Presigned URL the frontend can PUT the file to directly, so raw
 * bytes never transit through this API server.
 */
export async function getUploadUrl(storageKey: string, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.s3.bucket,
    Key: storageKey,
    ContentType: mimeType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

/**
 * Presigned URL to read/download a document. Short-lived on purpose —
 * these are investigation documents, not public assets.
 */
export async function getDownloadUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: env.s3.bucket, Key: storageKey });
  return getSignedUrl(s3, command, { expiresIn: 120 });
}
