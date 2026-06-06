import express from 'express';

const app = express();
let serverApp: any = null;
let importError: any = null;

try {
  const serverModule = await import('../server.js');
  serverApp = serverModule.default;
} catch (err: any) {
  importError = {
    message: err.message,
    stack: err.stack,
    name: err.name
  };
}

app.use((req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/ping') {
    if (importError) {
      return res.status(500).json({
        status: "error",
        message: "Failed to import server.ts",
        error: importError
      });
    }
  }

  if (serverApp) {
    return serverApp(req, res, next);
  }

  res.status(500).json({
    status: "error",
    message: "Server app not initialized",
    error: importError
  });
});

export default app;

