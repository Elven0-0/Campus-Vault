import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static assets from public directory
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// API: Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    institution: 'SRM INSTITUTE OF SCIENCE & TECHNOLOGY',
    service: 'CampusVault Academic Repository API',
    timestamp: new Date().toISOString(),
  });
});

// API: Get departments & subjects
app.get('/api/departments', (_req: Request, res: Response) => {
  const departments = [
    {
      id: 'dept-math',
      code: 'MATH',
      name: '26MAB1001T — Calculus and Linear Algebra',
      shortName: '26MAB1001T · Calculus & Linear Algebra',
      description:
        'Vector Space and Matrices, Ordinary Differential Equations, Differential Calculus, Functions of Several Variables, and Sequence & Series.',
    },
    {
      id: 'dept-cse',
      code: 'CSE',
      name: '26CSE1002J — Programming for Problem Solving (PPS)',
      shortName: '26CSE1002J · Programming for Problem Solving',
      description:
        'Decision-Making, Modularity, Arrays and Strings, Structured Iterations, Dynamic Memory Allocation, and File Handling in C.',
    },
    {
      id: 'dept-eee',
      code: 'EEE',
      name: '26EEE1001T — Electrical and Electronics Engineering (EEE)',
      shortName: '26EEE1001T · Electrical & Electronics Engg.',
      description:
        'Electric Circuits, Semiconductor Devices, Logic Gates, Electrical Machines, Transducers, and Power Systems.',
    },
    {
      id: 'dept-phy',
      code: 'PHY',
      name: '26PYB1001J — Statistical and Quantum Physics for Computational Intelligence',
      shortName: '26PYB1001J · Statistical & Quantum Physics',
      description:
        'Computational Physics, Statistical Physics & Information Science, Quantum Mechanics, Quantum Computing, and Semiconductor Sensor Systems.',
    },
  ];
  res.json(departments);
});

// API: Repository overview statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    institution: 'SRM INSTITUTE OF SCIENCE & TECHNOLOGY',
    regulation: 'R2021',
    departmentsCount: 4,
    subjects: ['26MAB1001T', '26CSE1002J', '26EEE1001T', '26PYB1001J'],
    questionPapersCount: 19,
    labManualsCount: 2,
    syllabiCount: 3,
  });
});

// API: Check asset existence
app.get('/api/files/check', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: 'File path required' });
    return;
  }

  // Prevent directory traversal
  const sanitizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const targetFullPath = path.join(__dirname, 'public', sanitizedPath);

  if (fs.existsSync(targetFullPath)) {
    const stats = fs.statSync(targetFullPath);
    res.json({ exists: true, size: stats.size, path: sanitizedPath });
  } else {
    res.json({ exists: false, path: sanitizedPath });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!doctype html><html><head><title>SRM Academic Hub</title></head><body><h1>CampusVault</h1><p>Starting up...</p></body></html>');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusVault] Backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CampusVault] Server startup failure:', err);
  process.exit(1);
});
