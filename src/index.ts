// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import operatorRoutes from './routes/operatorRoutes';
import markerRoutes from './routes/markerRoutes';
import { buildAssignmentsIndex } from './services/assignmentIndexService';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Setup middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Verify whitelist.json exists
const ensureWhitelistExists = async () => {
  const whitelistPath = path.join(process.cwd(), 'whitelist.json');
  try {
    await fs.access(whitelistPath);
    console.log('✅ whitelist.json exists');
  } catch (error) {
    console.log('⚠️ whitelist.json not found, creating default...');
    const defaultWhitelist = {
      tokens: [
        {
          token: "melsoft-lms-operator-token-2023",
          description: "Operator frontend token",
          allowed_roles: ["operator"],
          created_at: new Date().toISOString()
        }
      ]
    };
    await fs.writeFile(whitelistPath, JSON.stringify(defaultWhitelist, null, 2));
    console.log('✅ Created default whitelist.json');
  }
};

// Verify assignments directory exists
const ensureAssignmentsDirExists = async () => {
  const assignmentsDir = path.join(process.cwd(), 'assignments');
  try {
    await fs.access(assignmentsDir);
    console.log('✅ assignments directory exists');
  } catch (error) {
    console.log('⚠️ assignments directory not found, creating...');
    await fs.mkdir(assignmentsDir, { recursive: true });
    console.log('✅ Created assignments directory');
    
    // Create a sample assignment
    const mathDir = path.join(assignmentsDir, 'Mathematics');
    await fs.mkdir(mathDir, { recursive: true });
    
    const sampleAssignment = {
      id: '1',
      name: 'Basic Math Test',
      subject: 'Mathematics',
      questions: [
        {
          id: '1',
          text: 'What is 2 + 2? Explain your answer.',
          answer: '4. The sum of 2 and 2 is 4 because when we combine two groups of two items, we get four items in total.',
          marks: 5
        },
        {
          id: '2',
          text: 'Solve for x: 2x + 3 = 7. Show your working.',
          answer: 'x = 2. To solve this, subtract 3 from both sides: 2x = 4, then divide both sides by 2: x = 2.',
          marks: 10
        },
        {
          id: '3',
          text: 'What is the area of a rectangle with length 6 units and width 4 units? Explain the formula you used.',
          answer: 'The area is 24 square units. Using the formula Area = length × width, we multiply 6 by 4 to get 24 square units.',
          marks: 8
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(mathDir, 'Basic Math Test.json'),
      JSON.stringify(sampleAssignment, null, 2)
    );
    console.log('✅ Created sample math assignment');
  }
};

// Setup routes
app.use('/api/operator', operatorRoutes);
app.use('/api/marker', markerRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LMS Bot Marker API', status: 'healthy' });
});

// Add a route to rebuild the index manually if needed
app.post('/api/admin/rebuild-index', async (req, res) => {
  try {
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

// Error handler middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
});

// Start server after ensuring directories and files exist
const startServer = async () => {
  try {
    await ensureWhitelistExists();
    await ensureAssignmentsDirExists();
    
    // Build or update the assignments index
    console.log('Initializing assignments index...');
    await buildAssignmentsIndex(); // No need to force rebuild
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API URL: http://localhost:${port}/api`);
      console.log(`Health Check: http://localhost:${port}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();