import express from 'express';
import db from '../services/database.js';

const router = express.Router();

// Database connectivity and basic stats
router.get('/test-db', async (req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    let termsCount = 0;
    try {
      const terms = await db.query('SELECT COUNT(*) as count FROM termes');
      termsCount = terms[0].count;
    } catch (e) {
      const terms2 = await db.query('SELECT COUNT(*) as count FROM terms');
      termsCount = terms2[0].count;
    }

    res.json({
      status: 'success',
      database: 'connected',
      stats: { users: users[0].count, terms: termsCount },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur de base de données',
      error: error.message,
    });
  }
});

export default router;
