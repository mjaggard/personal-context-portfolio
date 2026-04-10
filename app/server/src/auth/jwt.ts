import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { config } from "../config.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const jwksClient = jwksRsa({
  jwksUri: config.keycloakJwksUri,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      if (!key) return reject(new Error("No signing key found"));
      resolve(key.getPublicKey());
    });
  });
}

export async function validateToken(token: string): Promise<string> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header.kid) {
    throw new Error("Invalid token: missing kid");
  }

  const signingKey = await getSigningKey(decoded.header.kid);

  const payload = jwt.verify(token, signingKey, {
    issuer: config.keycloakIssuer,
    algorithms: ["RS256"],
  }) as jwt.JwtPayload;

  if (!payload.sub) {
    throw new Error("Invalid token: missing sub claim");
  }

  return payload.sub;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  validateToken(token)
    .then((userId) => {
      req.userId = userId;
      next();
    })
    .catch((err) => {
      console.error("JWT validation failed:", err.message);
      res.status(401).json({ error: "Invalid or expired token" });
    });
}
