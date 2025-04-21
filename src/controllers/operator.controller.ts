// src/controllers/operator.controller.ts
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { CreateAssignmentDto, UpdateAssignmentDto, Assignment } from '../types';
import { 
  getAssignmentIndex, 
  findAssignment, 
  updateAssignmentInIndex, 
  removeAssignmentFromIndex,
  normalizeString
} from '../services/assignmentIndexService';

const ASSIGNMENTS_DIR = path.join(process.cwd(), 'assignments');

export class OperatorController {
  private async ensureDirectoryExists(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async getAssignmentPath(subject: string, name: string): Promise<string> {
    const subjectDir = path.join(ASSIGNMENTS_DIR, subject);
    await this.ensureDirectoryExists(subjectDir);
    return path.join(subjectDir, `${name}.json`);
  }

  async listAssignments(req: Request, res: Response) {
    try {
      console.log("Listing assignments using index...");
      
      // Use the index instead of scanning directories
      const index = await getAssignmentIndex();
      console.log(`Found ${index.assignments.length} assignments in index`);
      
      // Convert index entries to Assignment objects
      const assignments: Assignment[] = [];
      
      for (const entry of index.assignments) {
        try {
          const filePath = path.join(process.cwd(), entry.path);
          console.log(`Reading assignment from: ${filePath}`);
          const content = await fs.readFile(filePath, 'utf-8');
          const assignment: Assignment = JSON.parse(content);
          assignments.push(assignment);
        } catch (error) {
          console.error(`Error reading assignment file ${entry.path}:`, error);
          // Return a minimal assignment object if file can't be read
          assignments.push({
            id: entry.id,
            name: entry.name,
            subject: entry.subject,
            questions: [],
            createdAt: entry.updatedAt,
            updatedAt: entry.updatedAt
          });
        }
      }
      
      console.log(`Successfully loaded ${assignments.length} assignments`);
      console.log(`Assignments being returned:`, assignments.map(a => ({ id: a.id, name: a.name, subject: a.subject })));
      res.json(assignments);
    } catch (error) {
      console.error('Error listing assignments:', error);
      res.status(500).json({ message: 'Error listing assignments', error: String(error) });
    }
  }

  async createAssignment(req: Request, res: Response) {
    try {
      const assignment: CreateAssignmentDto = req.body;
      const filePath = await this.getAssignmentPath(assignment.subject, assignment.name);

      const newAssignment: Assignment = {
        ...assignment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Write the assignment file
      await fs.writeFile(filePath, JSON.stringify(newAssignment, null, 2));
      
      // Update the index
      const fileName = path.basename(filePath);
      await updateAssignmentInIndex(newAssignment, assignment.subject, fileName);
      
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ message: 'Error creating assignment', error: String(error) });
    }
  }

  async updateAssignment(req: Request, res: Response) {
    try {
      const { subject, name } = req.params;
      const updates: UpdateAssignmentDto = req.body;
      
      console.log(`Updating assignment: subject=${subject}, name=${name}`);
      
      // Find the assignment in the index first
      const indexEntry = await findAssignment(subject, name);
      
      if (!indexEntry) {
        console.error(`Assignment not found in index: ${subject}/${name}`);
        console.error(`Normalized values: ${normalizeString(subject)}/${normalizeString(name)}`);
        return res.status(404).json({ 
          message: 'Assignment not found',
          subject,
          name,
          normalizedSubject: normalizeString(subject),
          normalizedName: normalizeString(name)
        });
      }
      
      // Get the actual file path
      const filePath = path.join(process.cwd(), indexEntry.path);
      console.log(`Found assignment at path: ${filePath}`);
      
      // Read the existing assignment
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existingAssignment: Assignment = JSON.parse(existingContent);

      const updatedAssignment: Assignment = {
        ...existingAssignment,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Write the updated assignment
      await fs.writeFile(filePath, JSON.stringify(updatedAssignment, null, 2));
      
      // Update the index
      const fileName = path.basename(filePath);
      await updateAssignmentInIndex(updatedAssignment, subject, fileName);
      
      res.json(updatedAssignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ 
        message: 'Error updating assignment', 
        error: String(error),
        params: req.params
      });
    }
  }

  async getAssignment(req: Request, res: Response) {
    try {
      const { subject, name } = req.params;
      
      console.log(`Getting assignment: subject=${subject}, name=${name}`);
      console.log(`Normalized values: ${normalizeString(subject)}/${normalizeString(name)}`);
      
      // Find the assignment in the index first
      const indexEntry = await findAssignment(subject, name);
      
      if (!indexEntry) {
        // List all available assignments in the index for debugging
        const index = await getAssignmentIndex();
        console.log('Available assignments in index:');
        index.assignments.forEach(a => {
          console.log(`- ${a.subject}/${a.name} (normalized: ${a.normalizedSubject}/${a.normalizedName})`);
        });
        
        return res.status(404).json({ 
          message: 'Assignment not found',
          subject,
          name,
          normalizedSubject: normalizeString(subject),
          normalizedName: normalizeString(name)
        });
      }
      
      // Get the actual file path from the index
      const filePath = path.join(process.cwd(), indexEntry.path);
      console.log(`Reading assignment from path: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const assignment: Assignment = JSON.parse(content);
      res.json(assignment);
    } catch (error) {
      console.error('Error getting assignment:', error);
      res.status(500).json({ 
        message: 'Error getting assignment', 
        error: String(error),
        params: req.params
      });
    }
  }
  
  async deleteAssignment(req: Request, res: Response) {
    try {
      const { subject, name } = req.params;
      
      // Find the assignment in the index first
      const indexEntry = await findAssignment(subject, name);
      
      if (!indexEntry) {
        return res.status(404).json({ 
          message: 'Assignment not found',
          subject,
          name
        });
      }
      
      // Get the actual file path from the index
      const filePath = path.join(process.cwd(), indexEntry.path);
      
      // Delete the file
      await fs.unlink(filePath);
      
      // Remove from index
      await removeAssignmentFromIndex(subject, name);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({ 
        message: 'Error deleting assignment', 
        error: String(error),
        params: req.params
      });
    }
  }
}