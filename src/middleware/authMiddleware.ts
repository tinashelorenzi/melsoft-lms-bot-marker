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
    console.log('Successfully loaded whitelist with tokens:', whitelist.tokens.map(t => ({ token: t.token.substring(0, 10) + "...", roles: t.allowed_roles })));
    return whitelist;
  } catch (error) {
    console.error('Error loading whitelist:', error);
    throw new Error('Failed to load API token whitelist');
  }
};

// Middleware to validate API tokens
export const validateApiToken = (requiredRole?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      console.log('Received authorization header:', authHeader ? 'Present' : 'Missing');

      if (!authHeader) {
        console.log('No authorization header found');
        return res.status(401).json({ error: 'No API token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      console.log('Extracted token:', token.substring(0, 10) + '...');

      const currentWhitelist = loadWhitelist();
      const tokenInfo = currentWhitelist.tokens.find((t) => t.token === token);
      console.log('Token found in whitelist:', !!tokenInfo);

      if (!tokenInfo) {
        console.log('Token not found in whitelist');
        return res.status(401).json({ error: 'Invalid API token' });
      }

      if (requiredRole && !tokenInfo.allowed_roles.includes(requiredRole)) {
        console.log(`Token roles ${tokenInfo.allowed_roles} do not include required role ${requiredRole}`);
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      console.log('Token validation successful');
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
      console.log('No token information available');
      return res.status(401).json({ message: 'No token information available' });
    }

    const tokenInfo = req.tokenInfo;
    const hasRequiredRole = roles.some(role => 
      tokenInfo.allowed_roles.includes(role)
    );

    if (!hasRequiredRole) {
      console.log('Token does not have required roles:', roles);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    console.log('Role check passed');
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