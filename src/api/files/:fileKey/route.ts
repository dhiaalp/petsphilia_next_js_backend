import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

let _s3: S3Client | null = null;
function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION || "auto",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      forcePathStyle: false,
    });
  }
  return _s3;
}

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bucket = process.env.S3_BUCKET_NAME || "";
  const encodedKey = req.params.fileKey;

  if (!encodedKey || !bucket) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  // The file key is URL-encoded by the S3 provider (encodeURIComponent)
  const key = decodeURIComponent(encodedKey);

  try {
    const s3Res = await getS3().send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    if (!s3Res.Body) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const ext = key.split(".").pop()?.toLowerCase() || "";
    const contentType =
      s3Res.ContentType || MIME_TYPES[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const bytes = await s3Res.Body.transformToByteArray();
    res.status(200).end(Buffer.from(bytes));
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchKey") {
      res.status(404).json({ error: "File not found" });
    } else {
      console.error("S3 proxy error:", err);
      res.status(500).json({ error: "Failed to fetch file" });
    }
  }
}
