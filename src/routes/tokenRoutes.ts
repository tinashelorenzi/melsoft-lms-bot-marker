import express from 'express';
import { validateApiToken } from '../middleware/authMiddleware';
import { TokenController } from '../controllers/token.controller';

const router = express.Router();
const tokenController = new TokenController();

// Get all tokens
router.get('/tokens', validateApiToken(), (req, res) => {
  tokenController.getTokens(req, res);
});

// Create a new token
router.post('/tokens', validateApiToken(), (req, res) => {
  tokenController.createToken(req, res);
});

// Get all whitelisted tokens
router.get('/whitelist', validateApiToken(), (req, res) => {
  tokenController.getWhitelistedTokens(req, res);
});

// Add a token to the whitelist
router.post('/whitelist', validateApiToken(), (req, res) => {
  tokenController.addToWhitelist(req, res);
});

// Remove a token from the whitelist
router.delete('/whitelist/:token', validateApiToken(), (req, res) => {
  tokenController.removeFromWhitelist(req, res);
});

export default router; 