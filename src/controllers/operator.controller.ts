import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { CreateAssignmentDto, UpdateAssignmentDto, Assignment } from '../types';

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
      await this.ensureDirectoryExists(ASSIGNMENTS_DIR);
      
      const subjects = await fs.readdir(ASSIGNMENTS_DIR);
      const assignments: Assignment[] = [];
      
      for (const subject of subjects) {
        const subjectDir = path.join(ASSIGNMENTS_DIR, subject);
        try {
          const files = await fs.readdir(subjectDir);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                const filePath = path.join(subjectDir, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const assignment: Assignment = JSON.parse(content);
                assignments.push(assignment);
              } catch (error) {
                console.error(`Error reading assignment file ${file}:`, error);
                // Continue with other files even if one fails
                continue;
              }
            }
          }
        } catch (error) {
          console.error(`Error reading subject directory ${subject}:`, error);
          // Continue with other subjects even if one fails
          continue;
        }
      }
      
      res.json(assignments);
    } catch (error) {
      console.error('Error listing assignments:', error);
      res.status(500).json({ message: 'Error listing assignments' });
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

      await fs.writeFile(filePath, JSON.stringify(newAssignment, null, 2));
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ message: 'Error creating assignment' });
    }
  }

  async updateAssignment(req: Request, res: Response) {
    try {
      const { subject, name } = req.params;
      const updates: UpdateAssignmentDto = req.body;
      const filePath = await this.getAssignmentPath(subject, name);

      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existingAssignment: Assignment = JSON.parse(existingContent);

      const updatedAssignment: Assignment = {
        ...existingAssignment,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(filePath, JSON.stringify(updatedAssignment, null, 2));
      res.json(updatedAssignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ message: 'Error updating assignment' });
    }
  }

  async getAssignment(req: Request, res: Response) {
    try {
      const { subject, name } = req.params;
      const filePath = await this.getAssignmentPath(subject, name);

      const content = await fs.readFile(filePath, 'utf-8');
      const assignment: Assignment = JSON.parse(content);
      res.json(assignment);
    } catch (error) {
      console.error('Error getting assignment:', error);
      res.status(500).json({ message: 'Error getting assignment' });
    }
  }
} 