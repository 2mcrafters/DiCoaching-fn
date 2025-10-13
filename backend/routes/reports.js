import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const selectReportsEnglish = `
  SELECT r.*, t.term as term_title, t.slug as term_slug,
         u.firstname, u.lastname, u.email as reporter_email
  FROM reports r
  LEFT JOIN terms t ON r.term_id = t.id
  LEFT JOIN users u ON r.reporter_id = u.id
`;

const selectReportsFrench = `
  SELECT r.*, t.terme as term_title, NULL as term_slug,
         u.firstname, u.lastname, u.email as reporter_email
  FROM reports r
  LEFT JOIN termes t ON r.term_id = t.id
  LEFT JOIN users u ON r.reporter_id = u.id
`;

const queryReports = async ({
  whereClause = '',
  params = [],
  orderClause = 'ORDER BY r.created_at DESC',
} = {}) => {
  const suffix = `${whereClause ? ` ${whereClause}` : ''}${
    orderClause ? ` ${orderClause}` : ''
  }`;
  try {
    return await db.query(`${selectReportsEnglish} ${suffix}`, params);
  } catch (errEn) {
    return await db.query(`${selectReportsFrench} ${suffix}`, params);
  }
};

// GET /api/reports - Récupérer tous les signalements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const reports = await queryReports();

    res.json({
      status: 'success',
      data: reports,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des signalements:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des signalements',
      error: error.message,
    });
  }
});

// POST /api/reports - Créer un nouveau signalement
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { term_id, reason, details } = req.body;
    const reporter_id = req.user.id;

    if (!term_id || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'L\'ID du terme et la raison sont requis',
      });
    }

    const result = await db.query(`
      INSERT INTO reports (term_id, reporter_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `, [term_id, reporter_id, reason, details || null]);

    const newReport = await queryReports({
      whereClause: 'WHERE r.id = ?',
      params: [result.insertId],
      orderClause: '',
    });

    res.status(201).json({
      status: 'success',
      message: 'Signalement créé avec succès',
      data: newReport[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création du signalement:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création du signalement',
      error: error.message,
    });
  }
});

// PUT /api/reports/:id - Mettre à jour un signalement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Le statut est requis',
      });
    }

    await db.query(`
      UPDATE reports 
      SET status = ?, admin_comment = ?, reviewed_at = NOW(), reviewer_id = ?
      WHERE id = ?
    `, [status, admin_comment || null, req.user.id, id]);

    const updatedReport = await queryReports({
      whereClause: 'WHERE r.id = ?',
      params: [id],
      orderClause: '',
    });

    if (updatedReport.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Signalement non trouvé',
      });
    }

    res.json({
      status: 'success',
      message: 'Signalement mis à jour avec succès',
      data: updatedReport[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du signalement:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du signalement',
      error: error.message,
    });
  }
});

// DELETE /api/reports/:id - Supprimer un signalement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM reports WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Signalement non trouvé',
      });
    }

    res.json({
      status: 'success',
      message: 'Signalement supprimé avec succès',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du signalement:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression du signalement',
      error: error.message,
    });
  }
});

export default router;
