// server.ts - Fullstack server providing API endpoints and Vite dev middleware
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables from .env
dotenv.config();

// Import netlify function handlers for exact parity
import { handler as migrateHandler } from './netlify/functions/migrate.js';
import { handler as submitHandler } from './netlify/functions/submit.js';
import { handler as adminActionHandler } from './netlify/functions/admin-action.js';
import { handler as setPotwHandler } from './netlify/functions/set-potw.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper to convert Express req/res to Netlify event structure
  async function runNetlifyFunction(fnHandler: Function, req: express.Request, res: express.Response) {
    try {
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        body: JSON.stringify(req.body)
      };
      const result = await fnHandler(event);
      res.status(result.statusCode || 200);
      if (result.headers) {
        Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v as string));
      }
      res.send(result.body);
    } catch (err: any) {
      console.error('[API Proxy Error]:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // API Routes mapped to Netlify function logic
  app.all('/api/migrate', (req, res) => runNetlifyFunction(migrateHandler, req, res));
  app.all('/api/submit', (req, res) => runNetlifyFunction(submitHandler, req, res));
  app.all('/api/admin-action', (req, res) => runNetlifyFunction(adminActionHandler, req, res));
  app.all('/api/set-potw', (req, res) => runNetlifyFunction(setPotwHandler, req, res));

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
