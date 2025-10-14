import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';
import { createNotification } from "../services/notifications.js";

const router = express.Router();

const slugify = (s = "") =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Get like count for a term
router.get("/terms/:termId/likes", async (req, res) => {
  try {
    const { termId } = req.params;
    const [row] = await db.query(
      "SELECT COUNT(*) as count FROM likes WHERE term_id = ?",
      [termId]
    );
    res.json({ status: "success", data: { count: Number(row?.count || 0) } });
  } catch (e) {
    console.error("[likes] count error:", e.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des likes",
      });
  }
});

// Get whether current user liked the term
router.get('/terms/:termId/likes/me', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const [row] = await db.query('SELECT id FROM likes WHERE term_id = ? AND user_id = ? LIMIT 1', [termId, req.user.id]);
    res.json({ status: 'success', data: { likedByUser: !!row } });
  } catch (e) {
    console.error('[likes] me error:', e.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement' });
  }
});

// Toggle like
router.post('/terms/:termId/likes/toggle', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const [existing] = await db.query(
      "SELECT id FROM likes WHERE term_id = ? AND user_id = ? LIMIT 1",
      [termId, req.user.id]
    );
    let liked = false;
    if (existing) {
      await db.query("DELETE FROM likes WHERE id = ?", [existing.id]);
      liked = false;
    } else {
      await db.query(
        "INSERT INTO likes (term_id, user_id, created_at) VALUES (?, ?, NOW())",
        [termId, req.user.id]
      );
      liked = true;

      // Notify term author
      try {
        let [term] = await db.query(
          "SELECT id, terme, slug, author_id FROM termes WHERE id = ? LIMIT 1",
          [termId]
        );
        if (
          term &&
          term.author_id &&
          String(term.author_id) !== String(req.user.id)
        ) {
          const slug = term.slug || slugify(term.terme || "");
          await createNotification({
            userId: term.author_id,
            type: "like",
            title: "Votre terme a reçu un like",
            message: term.terme || "Un terme",
            link: `/fiche/${slug}`,
            refs: { termId: Number(termId) },
            meta: {
              actor: {
                id: req.user.id,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
              },
              termTitle: term.terme,
            },
          });
        }
      } catch (nErr) {
        console.warn("[likes] notification warning:", nErr?.message);
      }
    }

    const [row] = await db.query('SELECT COUNT(*) as count FROM likes WHERE term_id = ?', [termId]);
    res.json({ status: 'success', data: { count: Number(row?.count || 0), liked } });
  } catch (e) {
    console.error('[likes] toggle error:', e.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la mise à jour du like' });
  }
});

export default router;
