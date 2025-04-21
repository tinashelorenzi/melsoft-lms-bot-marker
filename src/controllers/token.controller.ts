import { Request, Response } from 'express';
import { TokenInfo } from '../types';
import { tokenStorage } from '../lib/tokenStorage';

export class TokenController {
  // Get all tokens
  getTokens(req: Request, res: Response) {
    try {
      const tokens = tokenStorage.getTokens();
      return res.status(200).json({ tokens });
    } catch (error) {
      console.error('Error getting tokens:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new token
  createToken(req: Request, res: Response) {
    try {
      const { name, role } = req.body;

      if (!name || !role) {
        return res.status(400).json({ error: 'Name and role are required' });
      }

      // Generate a random token
      const token = `melsoft-lms-${Math.random().toString(36).substring(2)}-${Date.now()}`;

      const newToken: TokenInfo = {
        token,
        name,
        role,
        createdAt: new Date().toISOString(),
      };

      tokenStorage.addToken(newToken);

      return res.status(201).json(newToken);
    } catch (error) {
      console.error('Error creating token:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all whitelisted tokens
  getWhitelistedTokens(req: Request, res: Response) {
    try {
      const tokens = tokenStorage.getWhitelistedTokens();
      return res.status(200).json({ tokens });
    } catch (error) {
      console.error('Error getting whitelisted tokens:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add a token to the whitelist
  addToWhitelist(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Check if token already exists in whitelist
      if (tokenStorage.isTokenWhitelisted(token)) {
        return res.status(400).json({ error: 'Token already whitelisted' });
      }

      // Find the token in the tokens list
      const tokenInfo = tokenStorage.findToken(token);
      if (!tokenInfo) {
        return res.status(404).json({ error: 'Token not found' });
      }

      tokenStorage.addToWhitelist(tokenInfo);
      return res.status(201).json(tokenInfo);
    } catch (error) {
      console.error('Error adding token to whitelist:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Remove a token from the whitelist
  removeFromWhitelist(req: Request, res: Response) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      if (!tokenStorage.isTokenWhitelisted(token)) {
        return res.status(404).json({ error: 'Token not found in whitelist' });
      }

      tokenStorage.removeFromWhitelist(token);
      return res.status(200).json({ message: 'Token removed from whitelist' });
    } catch (error) {
      console.error('Error removing token from whitelist:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 