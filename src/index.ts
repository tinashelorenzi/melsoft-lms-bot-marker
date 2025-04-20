import express from 'express';
import dotenv from 'dotenv';
import operatorRoutes from './routes/operatorRoutes';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Routes
app.use('/api/operator', operatorRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LMS Bot Marker API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 