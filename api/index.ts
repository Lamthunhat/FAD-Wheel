import express from 'express';

const app = express();

app.get('/api/ping', (req, res) => {
  res.json({ ping: 'pong', mode: 'simple-debug', time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'simple-debug' });
});

export default app;
