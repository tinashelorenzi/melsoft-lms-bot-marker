import { buildAssignmentsIndex } from '../services/assignmentIndexService';

async function rebuildIndex() {
  console.log('Starting to rebuild assignment index...');
  
  try {
    const index = await buildAssignmentsIndex(true); // force rebuild
    
    console.log('Assignment index rebuilt successfully!');
    console.log(`Found ${index.assignments.length} assignments across ${index.subjects.length} subjects`);
    
    // Log all assignments found
    console.log('\nAssignments in index:');
    index.assignments.forEach(a => {
      console.log(`- ${a.subject}/${a.name} (normalized: ${a.normalizedSubject}/${a.normalizedName})`);
      console.log(`  Path: ${a.path}`);
    });
    
    console.log('\nSubjects in index:');
    index.subjects.forEach(s => {
      console.log(`- ${s.name} (id: ${s.id})`);
    });
    
  } catch (error) {
    console.error('Failed to rebuild index:', error);
    process.exit(1);
  }
}

rebuildIndex();