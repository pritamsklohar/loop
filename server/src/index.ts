import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import authRouter from './routes/auth';
import workspaceRouter from './routes/workspace';
import feedbackRouter from './routes/feedback';
import insightsRouter from './routes/insights';
import themesRouter from './routes/themes';
import askRouter from './routes/ask';
import reportsRouter from './routes/reports';

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/themes', themesRouter);
app.use('/api/ask', askRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

import path from 'path';

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(frontendDistPath));

// Fallback to React app for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
  } else {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
});

// Fallback 404 handler for API routes
app.use('/api', (req, res, next) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global exception handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Express Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
