import { NextApiRequest, NextApiResponse } from "next";
import { authMiddleware } from "../../../middleware/nextAuthMiddleware";
import { TokenInfo } from "../../../types";
import { tokenStorage } from "../../../lib/tokenStorage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Apply authentication middleware
    const authResult = await authMiddleware(req);
    if (!authResult.isAuthenticated) {
      return res.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    if (req.method === "GET") {
      return res.status(200).json({ tokens: tokenStorage.getTokens() });
    }

    if (req.method === "POST") {
      const { name, role } = req.body;

      if (!name || !role) {
        return res.status(400).json({ error: "Name and role are required" });
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
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in tokens API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 