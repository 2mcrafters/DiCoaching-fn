import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/terms/:termId/likes -> { count, likedByUser }
router.get('/terms/:termId/likes', async (req, res) => {
  try {
    const { termId } = req.params;
    const [{ cnt }] = await db.query('SELECT COUNT(*) AS cnt FROM likes WHERE term_id = ?', [termId]);

    res.json({ status: 'success', data: { count: Number(cnt) || 0 } });
  } catch (err) {
    console.error('Error fetching likes:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des likes', error: err.message });
  }
});

// GET /api/terms/:termId/likes/me -> { count, likedByUser }
router.get('/terms/:termId/likes/me', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user && req.user.id;
    const [{ cnt }] = await db.query('SELECT COUNT(*) AS cnt FROM likes WHERE term_id = ?', [termId]);
    const existing = await db.query('SELECT id FROM likes WHERE user_id = ? AND term_id = ?', [userId, termId]);
    res.json({ status: 'success', data: { count: Number(cnt) || 0, likedByUser: existing.length > 0 } });
  } catch (err) {
    console.error('Error fetching like status:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement du statut de like', error: err.message });
  }
});

// POST /api/terms/:termId/likes/toggle
router.post('/terms/:termId/likes/toggle', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user && req.user.id;

    // Check if already liked
    const existing = await db.query('SELECT id FROM likes WHERE user_id = ? AND term_id = ?', [userId, termId]);

    let liked;
    if (existing.length > 0) {
      await db.query('DELETE FROM likes WHERE user_id = ? AND term_id = ?', [userId, termId]);
      liked = false;
    } else {
      await db.query('INSERT INTO likes (user_id, term_id, created_at) VALUES (?, ?, NOW())', [userId, termId]);
      liked = true;
    }

    const [{ cnt }] = await db.query('SELECT COUNT(*) AS cnt FROM likes WHERE term_id = ?', [termId]);
    res.json({ status: 'success', data: { liked, count: Number(cnt) || 0 } });
  } catch (err) {
    console.error('Error toggling like:', err.message);
    res.status(500).json({ status: 'error', message: "Erreur lors de l'action d\'aimer", error: err.message });
  }
});

// GET /api/user/likes/stats -> Get total likes for user's terms
router.get('/user/likes/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    
    // Count total likes on all terms authored by this user
    const result = await db.query(
      `SELECT COUNT(*) AS totalLikes 
       FROM likes l 
       INNER JOIN termes t ON l.term_id = t.id 
       WHERE t.author_id = ?`,
      [userId]
    );
    
    const totalLikes = result[0]?.totalLikes || 0;
    res.json({ status: 'success', data: { totalLikes: Number(totalLikes) } });
  } catch (err) {
    console.error('Error fetching user like stats:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des statistiques de likes', error: err.message });
  }
});

// GET /api/user/liked-terms -> Get list of terms the user has liked
router.get('/user/liked-terms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    
    // Get all terms liked by this user with term details
    const likedTerms = await db.query(
      `SELECT 
        t.id,
        t.terme,
        t.definition,
        t.status,
        l.created_at as liked_at
       FROM likes l
       INNER JOIN termes t ON l.term_id = t.id
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`,
      [userId]
    );
    
    res.json({ 
      status: 'success', 
      data: likedTerms.map(term => ({
        id: term.id,
        term: term.terme,
        definition: term.definition,
        status: term.status,
        likedAt: term.liked_at
      }))
    });
  } catch (err) {
    console.error('Error fetching liked terms:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des termes aimés', error: err.message });
  }
});

export default router;
