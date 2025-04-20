import fs from 'fs/promises';
import path from 'path';
import { Assignment } from '../types';

async function setup() {
  const assignmentsDir = path.join(process.cwd(), 'assignments');
  const whitelistPath = path.join(process.cwd(), 'whitelist.json');
  
  try {
    console.log('Starting setup process...');
    
    // Create assignments directory if it doesn't exist
    try {
      await fs.access(assignmentsDir);
      console.log('✅ Assignments directory already exists');
    } catch {
      await fs.mkdir(assignmentsDir, { recursive: true });
      console.log('✅ Created assignments directory');
    }
    
    // Create a sample assignment
    const sampleDir = path.join(assignmentsDir, 'sample');
    try {
      await fs.access(sampleDir);
      console.log('✅ Sample subject directory already exists');
    } catch {
      await fs.mkdir(sampleDir, { recursive: true });
      console.log('✅ Created sample subject directory');
    }
    
    const sampleAssignmentPath = path.join(sampleDir, 'Sample Assignment.json');
    try {
      await fs.access(sampleAssignmentPath);
      console.log('✅ Sample assignment already exists');
    } catch {
      const sampleAssignment: Assignment = {
        id: Date.now().toString(),
        name: 'Sample Assignment',
        subject: 'sample',
        questions: [
          {
            id: '1',
            text: 'What is 2 + 2?',
            answer: '4',
            marks: 1
          },
          {
            id: '2',
            text: 'What is the capital of France?',
            answer: 'Paris',
            marks: 2
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        sampleAssignmentPath,
        JSON.stringify(sampleAssignment, null, 2)
      );
      console.log('✅ Created sample assignment');
    }
    
    // Create or check whitelist.json
    try {
      await fs.access(whitelistPath);
      console.log('✅ whitelist.json already exists');
    } catch {
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
      
      await fs.writeFile(
        whitelistPath,
        JSON.stringify(defaultWhitelist, null, 2)
      );
      console.log('✅ Created whitelist.json with default token');
    }
    
    // Display permissions of important directories and files
    async function displayPermissions(filePath: string) {
      try {
        const stats = await fs.stat(filePath);
        console.log(`- ${filePath}: Mode=${stats.mode.toString(8)}`);
      } catch (error) {
        console.error(`- Error checking ${filePath}:`, error);
      }
    }
    
    console.log('\nFile/Directory Permissions:');
    await displayPermissions(process.cwd());
    await displayPermissions(assignmentsDir);
    await displayPermissions(sampleDir);
    await displayPermissions(sampleAssignmentPath);
    await displayPermissions(whitelistPath);
    
    console.log('\n✨ Setup completed successfully!');
    console.log('You can now start the server with:');
    console.log('  npm run dev');
    console.log('\nOr start both the frontend and backend with:');
    console.log('  npm run dev:all');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();