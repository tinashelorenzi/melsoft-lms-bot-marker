import { Router } from 'express';
import { OperatorController } from '../controllers/operator.controller';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
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
    return res.status(200).json({ message: 'Login successful' });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// All routes below require operator authentication
router.use(authenticateOperator);

// List all assignments
router.get('/assignments', operatorController.listAssignments.bind(operatorController));

// Create a new assignment
router.post('/assignments', operatorController.createAssignment.bind(operatorController));

// Update an existing assignment
router.put('/assignments/:subject/:name', operatorController.updateAssignment.bind(operatorController));

// Get an assignment
router.get('/assignments/:subject/:name', operatorController.getAssignment.bind(operatorController));

export default router; 