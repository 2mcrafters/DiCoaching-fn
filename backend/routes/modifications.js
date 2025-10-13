import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';
import slugify from 'slugify';

const router = express.Router();

const selectEnglish = `
  SELECT m.*, t.term as term_title, t.slug as term_slug,
         u.firstname as proposer_firstname, u.lastname as proposer_lastname, u.email as proposer_email,
         r.firstname as reviewer_firstname, r.lastname as reviewer_lastname
  FROM proposed_modifications m
  LEFT JOIN terms t ON m.term_id = t.id
  LEFT JOIN users u ON m.proposer_id = u.id
  LEFT JOIN users r ON m.reviewer_id = r.id
`;

const selectFrench = `
  SELECT m.*, t.terme as term_title, NULL as term_slug,
         u.firstname as proposer_firstname, u.lastname as proposer_lastname, u.email as proposer_email,
         r.firstname as reviewer_firstname, r.lastname as reviewer_lastname
  FROM proposed_modifications m
  LEFT JOIN termes t ON m.term_id = t.id
  LEFT JOIN users u ON m.proposer_id = u.id
  LEFT JOIN users r ON m.reviewer_id = r.id
`;

const queryModifications = async ({
  whereClause = '',
  params = [],
  orderClause = 'ORDER BY m.created_at DESC',
} = {}) => {
  const suffix = `${whereClause ? ` ${whereClause}` : ''}${
    orderClause ? ` ${orderClause}` : ''
  }`;
  try {
    return await db.query(`${selectEnglish} ${suffix}`, params);
  } catch (errEn) {
    return await db.query(`${selectFrench} ${suffix}`, params);
  }
};

const normalizeModificationRow = (row) => {
  if (!row) return row;
  let parsedChanges = row.changes;
  if (typeof parsedChanges === 'string') {
    try {
      parsedChanges = JSON.parse(parsedChanges);
    } catch (_) {
      parsedChanges = null;
    }
  }
  return {
    ...row,
    id: row.id,
    term_id: row.term_id,
    proposer_id: row.proposer_id,
    reviewer_id: row.reviewer_id,
    changes: parsedChanges ?? {},
    term_slug:
      row.term_slug ||
      (row.term_title
        ? slugify(String(row.term_title), { lower: true, strict: true })
        : null),
    proposer_firstname: row.proposer_firstname ?? row.firstname ?? null,
    proposer_lastname: row.proposer_lastname ?? row.lastname ?? null,
    reviewer_firstname: row.reviewer_firstname ?? null,
    reviewer_lastname: row.reviewer_lastname ?? null,
  };
};

// GET /api/modifications - Récupérer toutes les modifications proposées
router.get('/', authenticateToken, async (req, res) => {
  try {
    const modifications = await queryModifications();

    res.json({
      status: 'success',
      data: modifications.map(normalizeModificationRow),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des modifications:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des modifications',
      error: error.message,
    });
  }
});

// GET /api/modifications/:id - Récupérer une modification proposée
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await queryModifications({
      whereClause: 'WHERE m.id = ?',
      params: [id],
      orderClause: '',
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Modification non trouvée',
      });
    }

    res.json({
      status: 'success',
      data: normalizeModificationRow(rows[0]),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("�?O Erreur lors de la récupération de la modification:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de la modification',
      error: error.message,
    });
  }
});

// POST /api/modifications - Créer une nouvelle modification proposée
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { term_id, changes, comment } = req.body;
    const proposer_id = req.user.id;

    if (!term_id || !changes) {
      return res.status(400).json({
        status: 'error',
        message: 'L\'ID du terme et les modifications sont requis',
      });
    }

    const result = await db.query(`
      INSERT INTO proposed_modifications (term_id, proposer_id, changes, comment, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `, [term_id, proposer_id, JSON.stringify(changes), comment || null]);

    const newRows = await queryModifications({
      whereClause: 'WHERE m.id = ?',
      params: [result.insertId],
      orderClause: '',
    });

    res.status(201).json({
      status: 'success',
      message: 'Modification proposée avec succès',
      data: normalizeModificationRow(newRows[0]),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la modification:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de la modification',
      error: error.message,
    });
  }
});

// PUT /api/modifications/:id - Mettre a jour une modification proposee
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment, comment, changes } = req.body;

    const existingRows = await db.query(
      'SELECT * FROM proposed_modifications WHERE id = ?',
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Modification non trouvee',
      });
    }

    const existing = existingRows[0];
    const role = (req.user.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const isOwner = Number(existing.proposer_id) === Number(req.user.id);

    const wantsAdminUpdate = typeof status !== 'undefined';
    const wantsOwnerUpdate =
      typeof comment !== 'undefined' || typeof changes !== 'undefined';

    if (!wantsAdminUpdate && !wantsOwnerUpdate) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun champ valide a mettre a jour',
      });
    }

    if (wantsAdminUpdate && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Action reservee aux administrateurs',
      });
    }

    if (wantsOwnerUpdate && !isOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne pouvez modifier que vos propres propositions',
      });
    }

    if (
      wantsOwnerUpdate &&
      existing.status &&
      existing.status.toLowerCase() !== 'pending'
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Cette proposition a deja ete traitee et ne peut plus etre modifiee',
      });
    }

    if (wantsAdminUpdate) {
      await db.query(
        `
        UPDATE proposed_modifications
        SET status = ?, admin_comment = ?, reviewed_at = NOW(), reviewer_id = ?
        WHERE id = ?
      `,
        [status, admin_comment || null, req.user.id, id]
      );
    }

    if (wantsOwnerUpdate) {
      const updateFields = [];
      const params = [];

      if (typeof comment !== 'undefined') {
        const cleanedComment =
          typeof comment === 'string' && comment.trim().length > 0
            ? comment.trim()
            : null;
        updateFields.push('comment = ?');
        params.push(cleanedComment);
      }

      if (typeof changes !== 'undefined') {
        let normalizedChanges = {};

        if (changes && typeof changes === 'object') {
          normalizedChanges = changes;
        } else if (typeof changes === 'string') {
          const trimmed = changes.trim();
          if (trimmed.length > 0) {
            try {
              normalizedChanges = JSON.parse(trimmed);
            } catch (error) {
              return res.status(400).json({
                status: 'error',
                message: 'Le format des modifications est invalide (JSON attendu)',
              });
            }
          }
        }

        updateFields.push('changes = ?');
        params.push(JSON.stringify(normalizedChanges || {}));
      }

      if (updateFields.length > 0) {
        params.push(id);
        await db.query(
          `UPDATE proposed_modifications SET ${updateFields.join(', ')} WHERE id = ?`,
          params
        );
      }
    }

    const updatedModification = await queryModifications({
      whereClause: 'WHERE m.id = ?',
      params: [id],
      orderClause: '',
    });

    if (!updatedModification || updatedModification.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Modification non trouvee',
      });
    }

    res.json({
      status: 'success',
      message: 'Modification mise a jour avec succes',
      data: normalizeModificationRow(updatedModification[0]),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise a jour de la modification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise a jour de la modification',
      error: error.message,
    });
  }
});

// DELETE /api/modifications/:id - Supprimer une modification proposée
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM proposed_modifications WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Modification non trouvée',
      });
    }

    res.json({
      status: 'success',
      message: 'Modification supprimée avec succès',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la modification:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de la modification',
      error: error.message,
    });
  }
});

export default router;
