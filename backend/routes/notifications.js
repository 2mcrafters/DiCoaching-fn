import express from 'express';
import { authenticateToken } from './auth.js';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../services/notifications.js';

const router = express.Router();

// GET /api/notifications?limit=20
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const items = await listNotifications(req.user.id, limit);
    res.json({ status: 'success', data: items });
  } catch (e) {
    console.error('[notifications] list error:', e.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ status: 'success', data: { count } });
  } catch (e) {
    console.error('[notifications] count error:', e.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du comptage des notifications' });
  }
});

// POST /api/notifications/:id/read
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await markRead(req.user.id, id);
    res.json({ status: 'success' });
  } catch (e) {
    console.error('[notifications] mark read error:', e.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du marquage comme lu' });
  }
});

// POST /api/notifications/mark-all-read
router.post('/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await markAllRead(req.user.id);
    res.json({ status: 'success' });
  } catch (e) {
    console.error('[notifications] mark all read error:', e.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du marquage en lot' });
  }
});

export default router;
