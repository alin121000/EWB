import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js';

import homeRoutes from './routes/home.js';
import workstreamRoutes from './routes/workstreams.js';
import dayRoutes from './routes/days.js';
import taskRoutes from './routes/tasks.js';
import feedbackRoutes from './routes/feedback.js';
import insightRoutes from './routes/insights.js';
import meetingRoutes from './routes/meetings.js';
import photoRoutes from './routes/photos.js';
import reviewRoutes from './routes/review.js';
import exportRoutes from './routes/export.js';
import searchRoutes from './routes/search.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
const uploadsDir = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/home', homeRoutes);
app.use('/api/workstreams', workstreamRoutes);
app.use('/api/days', dayRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`EWB Ghana field notebook server running on http://localhost:${PORT}`);
});
