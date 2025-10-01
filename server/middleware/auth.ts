import { Request, Response, NextFunction } from "express";

// Simple admin authentication middleware
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  
  // For simplicity, we're using basic token validation
  // In production, use JWT or session-based auth
  if (token === process.env.ADMIN_TOKEN || validateAdminCredentials(token)) {
    next();
  } else {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

function validateAdminCredentials(token: string): boolean {
  try {
    // Decode base64 token (email:password format)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    return email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export function generateAdminToken(email: string, password: string): string | null {
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Generate a simple token (base64 encoded credentials)
    return Buffer.from(`${email}:${password}`).toString('base64');
  }
  return null;
}
