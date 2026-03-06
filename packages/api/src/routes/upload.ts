import { FastifyInstance } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth.js";

const s3 = new S3Client({});
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || "casperevents-media";
const CDN_DOMAIN = process.env.CDN_DOMAIN || "";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadRoutes(app: FastifyInstance) {
  async function presign(folder: string, filename: string, contentType: string, fileSize?: number) {
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const key = `media/${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = CDN_DOMAIN ? `https://${CDN_DOMAIN}/${key}` : `/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  app.post(
    "/upload/presign",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { filename, contentType, fileSize, folder } = request.body as {
        filename: string;
        contentType: string;
        fileSize?: number;
        folder?: string;
      };

      if (!ALLOWED_TYPES.has(contentType)) {
        return reply.status(400).send({
          error: "Invalid content type. Allowed: jpeg, png, webp, gif",
        });
      }

      if (fileSize && fileSize > MAX_SIZE) {
        return reply.status(400).send({
          error: "File too large. Maximum 10 MB.",
        });
      }

      const target = folder === "logos" ? "logos" : "events";
      const result = await presign(target, filename, contentType, fileSize);
      return reply.send(result);
    }
  );
}
