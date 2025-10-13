import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/decisions - get all decisions (admin/researcher only)
router.get('/decisions', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user && req.user.role;
    
    if (!['admin', 'researcher'].includes(userRole)) {
      return res.status(403).json({ status: 'error', message: 'Accès non autorisé' });
    }

    const rows = await db.query(
      `SELECT d.id, d.term_id AS termId, d.user_id AS userId, d.decision_type AS decisionType,
              d.comment, d.created_at AS createdAt, d.updated_at AS updatedAt,
              u.firstname, u.lastname, u.email,
              t.terme AS termName
         FROM decisions d
         LEFT JOIN users u ON u.id = d.user_id
         LEFT JOIN termes t ON t.id = d.term_id
        ORDER BY d.created_at DESC`
    );

    const data = rows.map((r) => ({
      id: String(r.id),
      termId: String(r.termId),
      termName: r.termName || 'Terme inconnu',
      userId: String(r.userId),
      userName: [r.firstname, r.lastname].filter(Boolean).join(' ') || r.email || 'Utilisateur',
      decisionType: r.decisionType,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Error fetching decisions:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des décisions', error: err.message });
  }
});

// GET /api/terms/:termId/decisions - get decisions for a specific term
router.get('/terms/:termId/decisions', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    
    const rows = await db.query(
      `SELECT d.id, d.term_id AS termId, d.user_id AS userId, d.decision_type AS decisionType,
              d.comment, d.created_at AS createdAt, d.updated_at AS updatedAt,
              u.firstname, u.lastname, u.email
         FROM decisions d
         LEFT JOIN users u ON u.id = d.user_id
        WHERE d.term_id = ?
        ORDER BY d.created_at DESC`,
      [termId]
    );

    const data = rows.map((r) => ({
      id: String(r.id),
      termId: String(r.termId),
      userId: String(r.userId),
      userName: [r.firstname, r.lastname].filter(Boolean).join(' ') || r.email || 'Utilisateur',
      decisionType: r.decisionType,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Error fetching term decisions:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des décisions du terme', error: err.message });
  }
});

// POST /api/decisions - create a new decision (admin/researcher only)
router.post('/decisions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const userRole = req.user && req.user.role;
    const { termId, decisionType, comment } = req.body || {};

    if (!['admin', 'researcher'].includes(userRole)) {
      return res.status(403).json({ status: 'error', message: 'Accès non autorisé' });
    }

    if (!termId || !decisionType) {
      return res.status(400).json({ status: 'error', message: 'termId et decisionType sont requis' });
    }

    const validDecisionTypes = ['approved', 'rejected', 'pending', 'revision_requested'];
    if (!validDecisionTypes.includes(decisionType)) {
      return res.status(400).json({ status: 'error', message: 'Type de décision invalide' });
    }

    const result = await db.query(
      'INSERT INTO decisions (term_id, user_id, decision_type, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
      [termId, userId, decisionType, comment || null]
    );

    // Update term status based on decision
    let termStatus = 'pending';
    if (decisionType === 'approved') termStatus = 'published';
    else if (decisionType === 'rejected') termStatus = 'rejected';
    else if (decisionType === 'revision_requested') termStatus = 'draft';

    await db.query('UPDATE termes SET status = ? WHERE id = ?', [termStatus, termId]);

    res.status(201).json({ 
      status: 'success', 
      message: 'Décision créée avec succès',
      data: { id: String(result.insertId), termId, decisionType, comment }
    });
  } catch (err) {
    console.error('Error creating decision:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la création de la décision', error: err.message });
  }
});

// PUT /api/decisions/:decisionId - update a decision (admin/researcher only)
router.put('/decisions/:decisionId', authenticateToken, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const userId = req.user && req.user.id;
    const userRole = req.user && req.user.role;
    const { decisionType, comment } = req.body || {};

    if (!['admin', 'researcher'].includes(userRole)) {
      return res.status(403).json({ status: 'error', message: 'Accès non autorisé' });
    }

    // Check if decision exists
    const [decision] = await db.query('SELECT user_id, term_id FROM decisions WHERE id = ?', [decisionId]);
    
    if (!decision) {
      return res.status(404).json({ status: 'error', message: 'Décision non trouvée' });
    }

    // Only owner or admin can update
    if (decision.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Non autorisé à modifier cette décision' });
    }

    const updates = [];
    const values = [];

    if (decisionType) {
      const validDecisionTypes = ['approved', 'rejected', 'pending', 'revision_requested'];
      if (!validDecisionTypes.includes(decisionType)) {
        return res.status(400).json({ status: 'error', message: 'Type de décision invalide' });
      }
      updates.push('decision_type = ?');
      values.push(decisionType);

      // Update term status
      let termStatus = 'pending';
      if (decisionType === 'approved') termStatus = 'published';
      else if (decisionType === 'rejected') termStatus = 'rejected';
      else if (decisionType === 'revision_requested') termStatus = 'draft';

      await db.query('UPDATE termes SET status = ? WHERE id = ?', [termStatus, decision.term_id]);
    }

    if (comment !== undefined) {
      updates.push('comment = ?');
      values.push(comment || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Aucune mise à jour fournie' });
    }

    values.push(decisionId);
    await db.query(`UPDATE decisions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, values);

    res.json({ status: 'success', message: 'Décision mise à jour avec succès' });
  } catch (err) {
    console.error('Error updating decision:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la mise à jour de la décision', error: err.message });
  }
});

// DELETE /api/decisions/:decisionId - delete a decision (admin only)
router.delete('/decisions/:decisionId', authenticateToken, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const userRole = req.user && req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Seuls les administrateurs peuvent supprimer des décisions' });
    }

    const [decision] = await db.query('SELECT id FROM decisions WHERE id = ?', [decisionId]);
    
    if (!decision) {
      return res.status(404).json({ status: 'error', message: 'Décision non trouvée' });
    }

    await db.query('DELETE FROM decisions WHERE id = ?', [decisionId]);

    res.json({ status: 'success', message: 'Décision supprimée avec succès' });
  } catch (err) {
    console.error('Error deleting decision:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression de la décision', error: err.message });
  }
});

// GET /api/decisions/stats - get decision statistics (admin/researcher only)
router.get('/decisions/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user && req.user.role;
    
    if (!['admin', 'researcher'].includes(userRole)) {
      return res.status(403).json({ status: 'error', message: 'Accès non autorisé' });
    }

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN decision_type = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN decision_type = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN decision_type = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN decision_type = 'revision_requested' THEN 1 ELSE 0 END) AS revisionRequested
      FROM decisions`
    );

    res.json({ 
      status: 'success', 
      data: {
        total: Number(stats.total || 0),
        approved: Number(stats.approved || 0),
        rejected: Number(stats.rejected || 0),
        pending: Number(stats.pending || 0),
        revisionRequested: Number(stats.revisionRequested || 0)
      }
    });
  } catch (err) {
    console.error('Error fetching decision stats:', err.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors du chargement des statistiques', error: err.message });
  }
});

export default router;
