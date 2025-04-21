import { NextApiRequest, NextApiResponse } from "next";
import { tokenStorage } from "../lib/tokenStorage";

export interface AuthResult {
  isAuthenticated: boolean;
  error?: string;
}

export const authMiddleware = async (
  req: NextApiRequest
): Promise<AuthResult> => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Validating token, auth header present:", !!authHeader);

    if (!authHeader) {
      return { isAuthenticated: false, error: "No API token provided" };
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted:", token.substring(0, 10) + "...");

    // Check if the token is whitelisted
    const isWhitelisted = tokenStorage.isTokenWhitelisted(token);
    if (!isWhitelisted) {
      return { isAuthenticated: false, error: "Invalid API token" };
    }

    return { isAuthenticated: true };
  } catch (error) {
    console.error("Error in token validation:", error);
    return {
      isAuthenticated: false,
      error: "Internal server error during token validation",
    };
  }
}; 