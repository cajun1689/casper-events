import { FastifyInstance } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth.js";

const s3 = new S3Client({});
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || "cyh-calendar-media";

export async function uploadRoutes(app: FastifyInstance) {
  app.post(
    "/upload/presign",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { filename, contentType } = request.body as {
        filename: string;
        contentType: string;
      };

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(contentType)) {
        return reply.status(400).send({
          error: "Invalid content type. Allowed: jpeg, png, webp, gif",
        });
      }

      const ext = filename.split(".").pop() || "jpg";
      const key = `events/${randomUUID()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const publicUrl = `/media/${key}`;

      return reply.send({ uploadUrl, publicUrl });
    }
  );
}
