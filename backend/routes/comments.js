import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';
import { resolveProfilePicturePayload } from '../services/uploadService.js';

const router = express.Router();

const mapCommentRow = (row) => {
  const authorId = row.authorId != null ? String(row.authorId) : null;
  const authorName = [row.firstname, row.lastname].filter(Boolean).join(' ') || row.name || row.email || 'Utilisateur';
  const { profile_picture, profile_picture_url } = resolveProfilePicturePayload(row.profilePicture);
  const authorRole = row.role || null;
  const authorSex = row.sex || null;

  return {
    id: String(row.id),
    termId: String(row.termId),
    authorId,
    content: row.content,
    createdAt: row.createdAt,
    authorName,
    author: authorId
      ? {
          id: authorId,
          name: authorName,
          role: authorRole,
          sex: authorSex,
          profile_picture: profile_picture,
          profile_picture_url: profile_picture_url,
        }
      : null,
  };
};
// GET /api/terms/:termId/comments - list comments for a term
router.get('/terms/:termId/comments', async (req, res) => {
  try {
    const { termId } = req.params;
    const rows = await db.query(
      `SELECT c.id, c.term_id AS termId, c.user_id AS authorId, c.content, c.created_at AS createdAt,
              u.firstname, u.lastname, u.name, u.email, u.role, u.sex, u.profile_picture AS profilePicture
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
        WHERE c.term_id = ?
        ORDER BY c.created_at ASC`,
      [termId]
    );

    const data = rows.map(mapCommentRow);

    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des commentaires', error: err.message });
  }
});

// POST /api/terms/:termId/comments - add a comment (auth required)
router.post('/terms/:termId/comments', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user && req.user.id;
    const { content } = req.body || {};

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ status: 'error', message: 'Contenu du commentaire requis' });
    }

    await db.query(
      'INSERT INTO comments (term_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
      [termId, userId, content.trim()]
    );

    // Return the updated list for simplicity
    const rows = await db.query(
      `SELECT c.id, c.term_id AS termId, c.user_id AS authorId, c.content, c.created_at AS createdAt,
              u.firstname, u.lastname, u.name, u.email, u.role, u.sex, u.profile_picture AS profilePicture
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
        WHERE c.term_id = ?
        ORDER BY c.created_at ASC`,
      [termId]
    );
    const data = rows.map(mapCommentRow);

    res.status(201).json({ status: 'success', data });
  } catch (err) {
    console.error('Error creating comment:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la création du commentaire', error: err.message });
  }
});

// DELETE /api/comments/:commentId - delete a comment (auth required, owner or admin only)
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user && req.user.id;
    const userRole = req.user && req.user.role;

    // Check if comment exists and get owner info
    const [comment] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    
    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'Commentaire non trouvé' });
    }

    // Only owner or admin can delete
    const privilegedRole = userRole === 'admin' || userRole === 'auteur' || userRole === 'author';
    const isOwner = comment.user_id === userId;
    if (!isOwner && !privilegedRole) {
      return res.status(403).json({ status: 'error', message: 'Non autorisé à supprimer ce commentaire' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

    res.json({ status: 'success', message: 'Commentaire supprimé avec succès' });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression du commentaire', error: err.message });
  }
});

export default router;
