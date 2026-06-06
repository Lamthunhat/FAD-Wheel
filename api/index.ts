import express from 'express';

const app = express();

let serverApp: any = null;
let importError: any = null;

// Thử load server.ts và bắt mọi lỗi runtime/import
try {
  const serverModule = await import('../server.js'); // Dùng .js vì khi Vercel compile sang ESM nó sẽ resolve .js hoặc .ts
  serverApp = serverModule.default;
} catch (err: any) {
  try {
    const serverModule = await import('../server.ts');
    serverApp = serverModule.default;
  } catch (err2: any) {
    importError = {
      message: err2.message,
      stack: err2.stack,
      name: err2.name,
      originalError: {
        message: err.message,
        stack: err.stack
      }
    };
  }
}

app.use((req, res, next) => {
  if (req.path === '/api/ping') {
    return res.json({
      ping: 'pong',
      mode: 'wrapper-debug',
      hasError: !!importError,
      error: importError,
      time: new Date().toISOString()
    });
  }

  if (importError) {
    return res.status(500).json({
      error: "Failed to import server.ts",
      details: importError
    });
  }

  if (serverApp) {
    return serverApp(req, res, next);
  }

  res.status(500).send("Express application not initialized.");
});

export default app;
