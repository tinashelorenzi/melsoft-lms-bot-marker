// src/scripts/rebuild-index.ts
import { buildAssignmentsIndex } from '../services/assignmentIndexService';
import fs from 'fs/promises';
import path from 'path';

async function rebuildIndex() {
  console.log('\n🔍 ASSIGNMENT INDEX REBUILDER 🔍\n');
  console.log('This tool will scan your assignments directory and rebuild the index file');
  console.log('that maps between course/assignment names and actual files on disk.\n');
  console.log('Starting to rebuild assignment index...');
  
  try {
    // First, show the current files in the assignments directory
    const ASSIGNMENTS_DIR = path.join(process.cwd(), 'assignments');
    console.log(`Reading assignments directory: ${ASSIGNMENTS_DIR}`);
    
    // Helper function to list files recursively
    async function listFiles(dir: string, indent = '') {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            console.log(`${indent}📁 ${entry.name}/`);
            await listFiles(fullPath, `${indent}  `);
          } else {
            try {
              const stats = await fs.stat(fullPath);
              console.log(`${indent}📄 ${entry.name} (${stats.size} bytes)`);
              
              // If it's a JSON file, try to read and validate it
              if (entry.name.endsWith('.json')) {
                try {
                  const content = await fs.readFile(fullPath, 'utf-8');
                  const parsed = JSON.parse(content);
                  console.log(`${indent}   ✅ Valid JSON with ${parsed.questions?.length || 0} questions`);
                } catch (jsonError) {
                  console.log(`${indent}   ❌ Invalid JSON: ${jsonError.message}`);
                }
              }
            } catch (statError) {
              console.log(`${indent}❌ Error reading ${entry.name}: ${statError.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`${indent}❌ Could not read directory: ${error.message}`);
      }
    }
    
    await listFiles(ASSIGNMENTS_DIR);
    
    // Now rebuild the index
    console.log('\nRebuilding index...');
    const index = await buildAssignmentsIndex(true); // force rebuild
    
    console.log('\n✅ Assignment index rebuilt successfully!');
    console.log(`Found ${index.assignments.length} assignments across ${index.subjects.length} subjects`);
    
    // Log all assignments found
    console.log('\nAssignments in index:');
    index.assignments.forEach(a => {
      console.log(`- ${a.subject}/${a.name} (normalized: ${a.normalizedSubject}/${a.normalizedName})`);
      console.log(`  Path: ${a.path}, Questions: ${a.questionCount}`);
    });
    
    console.log('\nSubjects in index:');
    index.subjects.forEach(s => {
      console.log(`- ${s.name} (id: ${s.id})`);
    });

    // Check if index file was created
    const indexPath = path.join(process.cwd(), 'assignments-index.json');
    try {
      const stats = await fs.stat(indexPath);
      console.log(`\nIndex file created: ${indexPath} (${stats.size} bytes)`);
    } catch (error) {
      console.error(`\nError verifying index file: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Failed to rebuild index:', error);
    process.exit(1);
  }
}