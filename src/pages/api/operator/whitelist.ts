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
      return res.status(200).json({ tokens: tokenStorage.getWhitelistedTokens() });
    }

    if (req.method === "POST") {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Check if token already exists in whitelist
      if (tokenStorage.isTokenWhitelisted(token)) {
        return res.status(400).json({ error: "Token already whitelisted" });
      }

      // Find the token in the tokens list
      const tokenInfo = tokenStorage.findToken(token);
      if (!tokenInfo) {
        return res.status(404).json({ error: "Token not found" });
      }

      tokenStorage.addToWhitelist(tokenInfo);
      return res.status(201).json(tokenInfo);
    }

    if (req.method === "DELETE") {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }

      if (!tokenStorage.isTokenWhitelisted(token)) {
        return res.status(404).json({ error: "Token not found in whitelist" });
      }

      tokenStorage.removeFromWhitelist(token);
      return res.status(200).json({ message: "Token removed from whitelist" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in whitelist API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 