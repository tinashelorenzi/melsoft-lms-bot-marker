// src/routes/operatorRoutes.ts
import express from 'express';
import { validateApiToken, requireRole } from '../middleware/authMiddleware';
import { OperatorController } from '../controllers/operator.controller';

const router = express.Router();
const operatorController = new OperatorController();

// Login endpoint (no authentication required)
router.post('/login', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  const [type, credentials] = authHeader.split(' ');

  if (type !== 'Basic') {
    return res.status(401).json({ message: 'Invalid authorization type' });
  }

  const [email, password] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':');

  console.log(`Login attempt: ${email}`);

  if (email === 'operator@melsoft.co.za' && password === 'password123') {
    // Return the API token upon successful login
    return res.status(200).json({ 
      message: 'Login successful',
      token: 'melsoft-lms-operator-token-2023'
    });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// Apply the API token validation middleware to all operator routes below
router.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Get all assignments - no role check needed
router.get('/assignments', validateApiToken(), async (req, res) => {
  try {
    console.log('Handling GET /assignments request');
    await operatorController.listAssignments(req, res);
  } catch (error) {
    console.error('Error in assignments endpoint:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
});

// Get a specific assignment by subject and name
router.get('/assignments/:subject/:name', validateApiToken(), operatorController.getAssignment.bind(operatorController));

// Create a new assignment
router.post('/assignments', validateApiToken(), operatorController.createAssignment.bind(operatorController));

// Update an assignment
router.put('/assignments/:subject/:name', validateApiToken(), operatorController.updateAssignment.bind(operatorController));

// Delete an assignment
router.delete('/assignments/:subject/:name', validateApiToken(), operatorController.deleteAssignment.bind(operatorController));

export default router;