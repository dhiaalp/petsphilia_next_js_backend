import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
  forcePathStyle: false,
});

const BUCKET = process.env.S3_BUCKET_NAME || "";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filePath = (req.params as Record<string, string>).path;

  if (!filePath || !BUCKET) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: filePath,
    });

    const s3Res = await s3Client.send(command);

    if (!s3Res.Body) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentType =
      s3Res.ContentType || MIME_TYPES[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const bytes = await s3Res.Body.transformToByteArray();
    res.status(200).end(Buffer.from(bytes));
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === "NoSuchKey") {
      res.status(404).json({ error: "File not found" });
    } else {
      console.error("S3 proxy error:", err);
      res.status(500).json({ error: "Failed to fetch file" });
    }
  }
}
