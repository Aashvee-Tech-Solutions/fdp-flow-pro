import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Fail-fast if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Cannot start server without it.");
}

const JWT_SECRET = process.env.JWT_SECRET;

interface JWTPayload {
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Validate admin credentials and generate token
export function generateAdminToken(email: string, password: string): string | null {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  // Fail-fast if admin credentials are not configured
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("FATAL: ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
  }
  
  // Validate credentials
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return null;
  }
  
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const payload: JWTPayload = {
    email,
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    
    if (signature !== expectedSignature) return null;
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as JWTPayload;
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Attach user info to request
  (req as any).user = payload;
  next();
}
