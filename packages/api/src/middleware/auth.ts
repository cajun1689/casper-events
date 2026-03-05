import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const COGNITO_REGION = process.env.AWS_REGION || "us-east-1";

const client = jwksClient({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600_000,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key?.getPublicKey());
  });
}

export interface AuthUser {
  sub: string;
  email: string;
  name?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await new Promise<AuthUser>((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) return reject(err);
        const payload = decoded as jwt.JwtPayload;
        resolve({
          sub: payload.sub!,
          email: payload.email as string,
          name: payload.name as string | undefined,
        });
      });
    });
    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return;

  const token = authHeader.slice(7);
  try {
    const decoded = await new Promise<AuthUser>((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) return reject(err);
        const payload = decoded as jwt.JwtPayload;
        resolve({
          sub: payload.sub!,
          email: payload.email as string,
          name: payload.name as string | undefined,
        });
      });
    });
    request.user = decoded;
  } catch {
    // silently ignore invalid tokens on optional routes
  }
}
