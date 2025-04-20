import fs from 'fs/promises';
import path from 'path';
import { Assignment } from '../types';

async function setup() {
  const assignmentsDir = path.join(process.cwd(), 'assignments');
  
  try {
    // Create assignments directory if it doesn't exist
    await fs.mkdir(assignmentsDir, { recursive: true });
    console.log('✅ Assignments directory created/verified');
    
    // Create a sample assignment to verify permissions
    const sampleDir = path.join(assignmentsDir, 'sample');
    await fs.mkdir(sampleDir, { recursive: true });
    
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
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(sampleDir, 'sample.json'),
      JSON.stringify(sampleAssignment, null, 2)
    );
    console.log('✅ Sample assignment created');
    
    console.log('✨ Setup completed successfully');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup(); 