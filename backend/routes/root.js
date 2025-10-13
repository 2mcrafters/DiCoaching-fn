import express from 'express';

const router = express.Router();

// Root route
router.get('/', (req, res) => {
  res.json({
    message: 'API Dictionnaire Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
