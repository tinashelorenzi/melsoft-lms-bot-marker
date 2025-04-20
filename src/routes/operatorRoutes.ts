import express from 'express';
import { validateApiToken, requireRole } from '../middleware/authMiddleware';
import { OperatorController } from '../controllers/operator.controller';
import fs from 'fs/promises';

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

  if (email === 'operator@melsoft.co.za' && password === 'password123') {
    // Return the API token upon successful login
    return res.status(200).json({ 
      message: 'Login successful',
      token: 'melsoft-lms-operator-token-2023'
    });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// Apply the API token validation middleware to all operator routes
router.use(validateApiToken);
// Ensure the token has the operator role
router.use(requireRole(['operator']));

// Get all assignments
router.get('/assignments', operatorController.listAssignments.bind(operatorController));

// Get a specific assignment by subject and name
router.get('/assignments/:subject/:name', operatorController.getAssignment.bind(operatorController));

// Create a new assignment
router.post('/assignments', operatorController.createAssignment.bind(operatorController));

// Update an assignment
router.put('/assignments/:subject/:name', operatorController.updateAssignment.bind(operatorController));

// Delete an assignment
router.delete('/assignments/:subject/:name', async (req, res) => {
  try {
    const { subject, name } = req.params;
    const filePath = await operatorController.getAssignmentPath(subject, name);
    
    await fs.unlink(filePath);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 