import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import adminCheckHandler from './api/admin/check';
import adminUsersHandler from './api/admin/users';
import adminUserDetailHandler from './api/admin/users/[id]';

function localApiPlugin(): Plugin {
  const dataPath = path.resolve(__dirname, 'data/exams.json');

  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

        if (pathname === '/api/exams') {
          if (req.method === 'GET') {
            const data = fs.readFileSync(dataPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          }

          if (req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            req.on('end', () => {
              fs.writeFileSync(dataPath, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            });
            return;
          }

          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        const adminHandler = pathname === '/api/admin/check'
          ? adminCheckHandler
          : pathname === '/api/admin/users'
            ? adminUsersHandler
            : /^\/api\/admin\/users\/[^/]+$/.test(pathname)
              ? adminUserDetailHandler
              : null;

        if (!adminHandler) {
          next();
          return;
        }

        Promise.resolve(adminHandler(req as never, res as never)).catch(next);
      });
    },
  };
}

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), localApiPlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
