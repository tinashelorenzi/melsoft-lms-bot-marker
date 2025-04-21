// src/services/assignmentIndexService.ts
import fs from 'fs/promises';
import path from 'path';
import { Assignment } from '../types';

export interface AssignmentIndexEntry {
  id: string;
  name: string;
  normalizedName: string;
  subject: string;
  normalizedSubject: string;
  path: string;
  updatedAt: string;
  questionCount: number;
}

export interface SubjectIndexEntry {
  id: string;
  name: string;
  path: string;
}

export interface AssignmentIndex {
  assignments: AssignmentIndexEntry[];
  subjects: SubjectIndexEntry[];
  lastUpdated: string;
}

const ASSIGNMENTS_DIR = path.join(process.cwd(), 'assignments');
const INDEX_PATH = path.join(process.cwd(), 'assignments-index.json');

// Global cache to avoid unnecessary file reads/writes
let cachedIndex: AssignmentIndex | null = null;

/**
 * Normalize a string to lowercase with hyphens instead of spaces
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Build or update the assignments index file
 */
export async function buildAssignmentsIndex(forceRebuild = false): Promise<AssignmentIndex> {
  // Check if we already have the index in memory and it's not a forced rebuild
  if (cachedIndex && !forceRebuild) {
    console.log('Using cached index');
    return cachedIndex;
  }

  console.log('Building assignments index...');
  
  // Create the assignments directory if it doesn't exist
  try {
    await fs.access(ASSIGNMENTS_DIR);
  } catch {
    await fs.mkdir(ASSIGNMENTS_DIR, { recursive: true });
  }
  
  // Initialize the index structure
  const index: AssignmentIndex = {
    assignments: [],
    subjects: [],
    lastUpdated: new Date().toISOString()
  };
  
  // Read all subject directories
  let subjects: string[];
  try {
    subjects = await fs.readdir(ASSIGNMENTS_DIR);
  } catch (error) {
    console.error('Error reading assignments directory:', error);
    subjects = [];
  }
  
  for (const subject of subjects) {
    const subjectDir = path.join(ASSIGNMENTS_DIR, subject);
    
    try {
      const stats = await fs.stat(subjectDir);
      
      if (stats.isDirectory()) {
        // Add subject to the index
        const normalizedSubject = normalizeString(subject);
        index.subjects.push({
          id: normalizedSubject,
          name: subject,
          path: `/assignments/${subject}`
        });
        
        // Read all assignment files in this subject
        const files = await fs.readdir(subjectDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(subjectDir, file);
              const content = await fs.readFile(filePath, 'utf-8');
              const assignment = JSON.parse(content) as Assignment;
              
              // Extract the assignment name without .json extension
              const name = file.replace(/\.json$/, '');
              const normalizedName = normalizeString(name);
              
              index.assignments.push({
                id: assignment.id || normalizedName,
                name: name,
                normalizedName: normalizedName,
                subject: subject,
                normalizedSubject: normalizedSubject,
                path: `/assignments/${subject}/${file}`,
                updatedAt: assignment.updatedAt || new Date().toISOString(),
                questionCount: assignment.questions?.length || 0
              });
            } catch (error) {
              console.error(`Error processing assignment file ${file}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading subject directory ${subject}:`, error);
    }
  }
  
  // Check if the index has actually changed before writing
  let shouldWrite = true;
  try {
    const existingContent = await fs.readFile(INDEX_PATH, 'utf-8');
    const existingIndex = JSON.parse(existingContent) as AssignmentIndex;
    
    // Simple comparison - if counts match and last assignments match, consider it unchanged
    if (
      existingIndex.assignments.length === index.assignments.length &&
      existingIndex.subjects.length === index.subjects.length
    ) {
      // Do a more detailed check on the assignments
      const existingIds = new Set(existingIndex.assignments.map(a => a.id));
      const newIds = new Set(index.assignments.map(a => a.id));
      
      // Check if all IDs match
      const allMatch = 
        [...existingIds].every(id => newIds.has(id)) &&
        [...newIds].every(id => existingIds.has(id));
        
      if (allMatch) {
        shouldWrite = false;
        console.log('Assignment index is up to date, skipping write');
      }
    }
  } catch (error) {
    // If file doesn't exist or can't be read, we should write the new index
    shouldWrite = true;
  }
  
  // Write the index file if needed
  if (shouldWrite) {
    try {
      await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
      console.log(`Assignment index updated with ${index.assignments.length} assignments and ${index.subjects.length} subjects`);
    } catch (error) {
      console.error('Error writing assignment index file:', error);
    }
  }
  
  // Update the cached index
  cachedIndex = index;
  
  return index;
}

/**
 * Get the current assignment index
 */
export async function getAssignmentIndex(): Promise<AssignmentIndex> {
  // Check if we already have the index in memory
  if (cachedIndex) {
    return cachedIndex;
  }
  
  try {
    await fs.access(INDEX_PATH);
    const content = await fs.readFile(INDEX_PATH, 'utf-8');
    cachedIndex = JSON.parse(content) as AssignmentIndex;
    return cachedIndex;
  } catch (error) {
    // If index doesn't exist, build it
    return await buildAssignmentsIndex(true);
  }
}

/**
 * Find an assignment in the index by subject and name
 */
export async function findAssignment(subject: string, name: string): Promise<AssignmentIndexEntry | null> {
  const normalizedSubject = normalizeString(subject);
  const normalizedName = normalizeString(name);
  
  const index = await getAssignmentIndex();
  
  return index.assignments.find(
    a => a.normalizedSubject === normalizedSubject && a.normalizedName === normalizedName
  ) || null;
}

/**
 * Find an assignment in the index by ID
 */
export async function findAssignmentById(id: string): Promise<AssignmentIndexEntry | null> {
  const index = await getAssignmentIndex();
  
  return index.assignments.find(a => a.id === id) || null;
}

/**
 * Add or update an assignment in the index
 */
export async function updateAssignmentInIndex(assignment: Assignment, subjectName: string, fileName: string): Promise<void> {
  const index = await getAssignmentIndex();
  
  const normalizedSubject = normalizeString(subjectName);
  const name = fileName.replace(/\.json$/, '');
  const normalizedName = normalizeString(name);
  
  // Check if subject exists in index
  if (!index.subjects.some(s => s.id === normalizedSubject)) {
    index.subjects.push({
      id: normalizedSubject,
      name: subjectName,
      path: `/assignments/${subjectName}`
    });
  }
  
  // Remove existing entry if present
  const existingIndex = index.assignments.findIndex(
    a => a.id === assignment.id || (a.normalizedSubject === normalizedSubject && a.normalizedName === normalizedName)
  );
  
  let updated = false;
  
  if (existingIndex >= 0) {
    const existingEntry = index.assignments[existingIndex];
    const newEntry = {
      id: assignment.id,
      name: name,
      normalizedName: normalizedName,
      subject: subjectName,
      normalizedSubject: normalizedSubject,
      path: `/assignments/${subjectName}/${fileName}`,
      updatedAt: assignment.updatedAt || new Date().toISOString(),
      questionCount: assignment.questions?.length || 0
    };
    
    // Check if anything has actually changed
    if (
      existingEntry.id !== newEntry.id ||
      existingEntry.updatedAt !== newEntry.updatedAt ||
      existingEntry.questionCount !== newEntry.questionCount ||
      existingEntry.path !== newEntry.path
    ) {
      index.assignments[existingIndex] = newEntry;
      updated = true;
    }
  } else {
    // Add the new assignment
    index.assignments.push({
      id: assignment.id,
      name: name,
      normalizedName: normalizedName,
      subject: subjectName,
      normalizedSubject: normalizedSubject,
      path: `/assignments/${subjectName}/${fileName}`,
      updatedAt: assignment.updatedAt || new Date().toISOString(),
      questionCount: assignment.questions?.length || 0
    });
    updated = true;
  }
  
  if (updated) {
    // Update the last updated timestamp
    index.lastUpdated = new Date().toISOString();
    
    // Update the cache
    cachedIndex = index;
    
    // Write the updated index
    await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
    console.log(`Updated index with assignment: ${subjectName}/${name}`);
  } else {
    console.log(`No changes needed in index for assignment: ${subjectName}/${name}`);
  }
}

/**
 * Remove an assignment from the index
 */
export async function removeAssignmentFromIndex(subject: string, name: string): Promise<void> {
  const index = await getAssignmentIndex();
  
  const normalizedSubject = normalizeString(subject);
  const normalizedName = normalizeString(name);
  
  // Check if the assignment exists in the index
  const existingIndex = index.assignments.findIndex(
    a => a.normalizedSubject === normalizedSubject && a.normalizedName === normalizedName
  );
  
  if (existingIndex >= 0) {
    // Remove the assignment from the index
    index.assignments.splice(existingIndex, 1);
    
    // Update the last updated timestamp
    index.lastUpdated = new Date().toISOString();
    
    // Update the cache
    cachedIndex = index;
    
    // Write the updated index
    await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
    console.log(`Removed assignment from index: ${subject}/${name}`);
  } else {
    console.log(`Assignment not found in index: ${subject}/${name}`);
  }
}