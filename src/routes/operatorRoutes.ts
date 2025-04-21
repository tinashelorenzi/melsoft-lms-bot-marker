// src/routes/operatorRoutes.ts
import express from 'express';
import { validateApiToken, requireRole } from '../middleware/authMiddleware';
import { OperatorController } from '../controllers/operator.controller';
import path from 'path';
import fs from 'fs/promises';
import { 
  getAssignmentIndex, 
  findAssignment, 
  buildAssignmentsIndex,
  normalizeString 
} from '../services/assignmentIndexService';

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

router.post('/debug/rebuild-index', validateApiToken(), async (req, res) => {
  try {
    console.log('Manually rebuilding assignment index...');
    const index = await buildAssignmentsIndex(true); // Force rebuild
    
    res.json({
      message: 'Assignment index rebuilt successfully',
      stats: {
        assignments: index.assignments.length,
        subjects: index.subjects.length,
        lastUpdated: index.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error rebuilding index:', error);
    res.status(500).json({ 
      message: 'Error rebuilding index', 
      error: String(error)
    });
  }
});

router.get('/debug/index', validateApiToken(), async (req, res) => {
  try {
    const index = await getAssignmentIndex();
    
    // Format the index for better readability
    const formattedIndex = {
      lastUpdated: index.lastUpdated,
      subjects: index.subjects,
      assignments: index.assignments.map(a => ({
        id: a.id,
        name: a.name,
        normalizedName: a.normalizedName,
        subject: a.subject,
        normalizedSubject: a.normalizedSubject,
        path: a.path,
        questionCount: a.questionCount
      }))
    };
    
    res.json({
      indexInfo: formattedIndex,
      fileCount: index.assignments.length,
      subjectCount: index.subjects.length
    });
  } catch (error) {
    console.error('Error retrieving index:', error);
    res.status(500).json({ 
      message: 'Error retrieving index', 
      error: String(error)
    });
  }
});

router.get('/debug/find-assignment/:subject/:name', validateApiToken(), async (req, res) => {
  try {
    const { subject, name } = req.params;
    
    // Try to find the assignment
    const indexEntry = await findAssignment(subject, name);
    
    if (!indexEntry) {
      // Check for similar assignments that might match
      const index = await getAssignmentIndex();
      const similarAssignments = index.assignments.filter(a => 
        a.subject.toLowerCase().includes(subject.toLowerCase()) || 
        a.normalizedSubject.includes(normalizeString(subject)) ||
        a.name.toLowerCase().includes(name.toLowerCase()) ||
        a.normalizedName.includes(normalizeString(name))
      );
      
      return res.status(404).json({ 
        message: 'Assignment not found',
        searchParams: {
          subject,
          name,
          normalizedSubject: normalizeString(subject),
          normalizedName: normalizeString(name)
        },
        similarAssignments: similarAssignments.length > 0 ? similarAssignments : 'No similar assignments found'
      });
    }
    
    // Assignment found
    res.json({
      message: 'Assignment found',
      assignment: indexEntry,
      filePath: path.join(process.cwd(), indexEntry.path)
    });
  } catch (error) {
    console.error('Error finding assignment:', error);
    res.status(500).json({ 
      message: 'Error finding assignment', 
      error: String(error),
      params: req.params
    });
  }
});

// Debug endpoint to list all files in the assignments directory
router.get('/debug/files', validateApiToken(), async (req, res) => {
  try {
    const ASSIGNMENTS_DIR = path.join(process.cwd(), 'assignments');
    
    // Helper function to list files recursively
    async function listFiles(dir: string, basePath = ''): Promise<any[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(basePath, entry.name);
          
          if (entry.isDirectory()) {
            return {
              type: 'directory',
              name: entry.name,
              path: relativePath,
              children: await listFiles(fullPath, relativePath)
            };
          } else {
            const stats = await fs.stat(fullPath);
            return {
              type: 'file',
              name: entry.name,
              path: relativePath,
              size: stats.size,
              lastModified: stats.mtime
            };
          }
        })
      );
      
      return files;
    }
    
    const fileTree = await listFiles(ASSIGNMENTS_DIR);
    
    res.json({
      message: 'File listing completed',
      rootDir: ASSIGNMENTS_DIR,
      files: fileTree
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      message: 'Error listing files', 
      error: String(error)
    });
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