import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface TokenInfo {
  token: string;
  description: string;
  allowed_roles: string[];
  created_at: string;
}

interface Whitelist {
  tokens: TokenInfo[];
}

let whitelist: Whitelist | null = null;

// Load the whitelist from the JSON file
const loadWhitelist = (): Whitelist => {
  if (whitelist) {
    return whitelist;
  }

  const whitelistPath = path.join(process.cwd(), 'whitelist.json');
  console.log('Loading whitelist from:', whitelistPath);

  try {
    const data = fs.readFileSync(whitelistPath, 'utf8');
    const parsedWhitelist = JSON.parse(data) as Whitelist;
    whitelist = parsedWhitelist;
    console.log('Successfully loaded whitelist with tokens:', whitelist.tokens.length);
    return whitelist;
  } catch (error) {
    console.error('Error loading whitelist:', error);
    // Provide a fallback whitelist with the hardcoded token
    return {
      tokens: [
        {
          token: "melsoft-lms-operator-token-2023",
          description: "Operator frontend token",
          allowed_roles: ["operator"],
          created_at: "2023-01-01T00:00:00Z"
        }
      ]
    };
  }
};

// Middleware to validate API tokens
export const validateApiToken = (requiredRole?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      console.log('Validating token, auth header present:', !!authHeader);

      if (!authHeader) {
        return res.status(401).json({ error: 'No API token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      console.log('Token extracted:', token.substring(0, 10) + '...');

      const currentWhitelist = loadWhitelist();
      const tokenInfo = currentWhitelist.tokens.find((t) => t.token === token);

      if (!tokenInfo) {
        return res.status(401).json({ error: 'Invalid API token' });
      }

      if (requiredRole && !tokenInfo.allowed_roles.includes(requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.tokenInfo = tokenInfo;
      next();
    } catch (error) {
      console.error('Error in token validation:', error);
      res.status(500).json({ error: 'Internal server error during token validation' });
    }
  };
};

// Middleware to check if the token has the required role
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tokenInfo) {
      return res.status(401).json({ message: 'No token information available' });
    }

    const tokenInfo = req.tokenInfo;
    const hasRequiredRole = roles.some(role => 
      tokenInfo.allowed_roles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Extend the Express Request type to include tokenInfo
declare global {
  namespace Express {
    interface Request {
      tokenInfo?: TokenInfo;
    }
  }
}