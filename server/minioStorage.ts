/**
 * MinIO Storage Adapter - S3-compatible local object storage
 */

import { Client } from "minio";

interface MinIOConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  useSSL: boolean;
}

function getMinIOConfig(): MinIOConfig {
  const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
  const accessKey =
    process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "minioadmin";
  const secretKey =
    process.env.MINIO_SECRET_KEY ||
    process.env.MINIO_ROOT_PASSWORD ||
    "minioadmin";
  const bucketName = process.env.MINIO_BUCKET_NAME || "resumes";
  const useSSL = process.env.MINIO_USE_SSL === "true";

  return { endpoint, accessKey, secretKey, bucketName, useSSL };
}

function createMinIOClient(): Client {
  const config = getMinIOConfig();

  // Remove protocol from endpoint
  const endpointUrl = new URL(config.endpoint);
  const port = endpointUrl.port
    ? parseInt(endpointUrl.port)
    : config.useSSL
      ? 443
      : 9000;

  return new Client({
    endPoint: endpointUrl.hostname,
    port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });
}

/**
 * Upload file to MinIO
 */
export async function minioStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getMinIOConfig();
  const client = createMinIOClient();
  const key = relKey.replace(/^\/+/, "");

  // Ensure bucket exists
  const bucketExists = await client.bucketExists(config.bucketName);
  if (!bucketExists) {
    await client.makeBucket(config.bucketName, "us-east-1");
  }

  // Convert data to Buffer if needed
  const buffer =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  // Upload to MinIO
  await client.putObject(config.bucketName, key, buffer, buffer.length, {
    "Content-Type": contentType,
  });

  // Generate public URL
  const url = `${config.endpoint}/${config.bucketName}/${key}`;

  return { key, url };
}

/**
 * Get file URL from MinIO (generates presigned URL valid for 7 days)
 */
export async function minioStorageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const config = getMinIOConfig();
  const client = createMinIOClient();
  const key = relKey.replace(/^\/+/, "");

  // Generate presigned URL (valid for 7 days)
  const url = await client.presignedGetObject(
    config.bucketName,
    key,
    7 * 24 * 60 * 60
  );

  return { key, url };
}

/**
 * Delete file from MinIO
 */
export async function minioStorageDelete(relKey: string): Promise<void> {
  const config = getMinIOConfig();
  const client = createMinIOClient();
  const key = relKey.replace(/^\/+/, "");

  await client.removeObject(config.bucketName, key);
}
