import { TokenInfo } from "../types";

// In-memory storage for tokens (replace with database in production)
let tokens: TokenInfo[] = [];
let whitelistedTokens: TokenInfo[] = [];

export const tokenStorage = {
  getTokens: () => tokens,
  setTokens: (newTokens: TokenInfo[]) => {
    tokens = newTokens;
  },
  addToken: (token: TokenInfo) => {
    tokens.push(token);
  },
  getWhitelistedTokens: () => whitelistedTokens,
  setWhitelistedTokens: (newTokens: TokenInfo[]) => {
    whitelistedTokens = newTokens;
  },
  addToWhitelist: (token: TokenInfo) => {
    whitelistedTokens.push(token);
  },
  removeFromWhitelist: (token: string) => {
    const index = whitelistedTokens.findIndex((t) => t.token === token);
    if (index !== -1) {
      whitelistedTokens.splice(index, 1);
    }
  },
  findToken: (token: string) => tokens.find((t) => t.token === token),
  isTokenWhitelisted: (token: string) =>
    whitelistedTokens.some((t) => t.token === token),
}; 