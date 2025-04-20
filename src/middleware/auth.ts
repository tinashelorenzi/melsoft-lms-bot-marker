import { Request, Response, NextFunction } from 'express';

const OPERATOR_EMAIL = 'operator@melsoft.co.za';
const OPERATOR_PASSWORD = 'password123';

export const authenticateOperator = (req: Request, res: Response, next: NextFunction) => {
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

  if (email !== OPERATOR_EMAIL || password !== OPERATOR_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  next();
}; 