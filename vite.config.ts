import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pathToFileURL } from 'node:url';

function certificateApiDevPlugin() {
  return {
    name: 'certificate-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/render-certificate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Allow', 'POST');
          res.end('Method not allowed');
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', async () => {
          try {
            const bodyText = Buffer.concat(chunks).toString('utf8') || '{}';
            const certificateApiUrl = `${pathToFileURL(`${server.config.root}/api/render-certificate.js`).href}?t=${Date.now()}`;
            const { default: handler } = await import(certificateApiUrl);
            await handler(
              {
                method: 'POST',
                body: JSON.parse(bodyText),
                headers: {
                  authorization: req.headers.authorization,
                },
              },
              {
                setHeader: (name: string, value: string) => res.setHeader(name, value),
                status: (code: number) => {
                  res.statusCode = code;
                  return {
                    send: (value: string | Buffer) => res.end(value),
                    json: (value: unknown) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(value));
                    },
                  };
                },
              }
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [certificateApiDevPlugin(), react()],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
