import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const pickValue = (payload, keys) => {
  for (const key of keys) {
    if (hasOwn(payload, key)) {
      return payload[key];
    }
  }
  return undefined;
};

const normalizeTextList = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object") {
          return String(entry.text || entry.value || entry.content || "").trim();
        }
        return "";
      })
      .filter(Boolean);
    return normalized.join("\n");
  }
  if (typeof value === "object") {
    if (value.text) return String(value.text);
    if (value.value) return String(value.value);
    if (value.content) return String(value.content);
  }
  return typeof value === "string" ? value : String(value ?? "");
};

const coerceNumeric = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const findTermRecord = async (id) => {
  const tables = ["termes", "terms"];
  let lastError = null;
  for (const table of tables) {
    try {
      const rows = await db.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        return { table, row: rows[0] };
      }
    } catch (error) {
      if (error && error.code === "ER_NO_SUCH_TABLE") {
        continue;
      }
      lastError = error;
    }
  }
  if (lastError) {
    throw lastError;
  }
  return null;
};

// GET /api/terms
router.get('/', async (req, res) => {
  try {
    const { search, category, limit } = req.query;
    let sql = `
      SELECT t.*, c.libelle as categorie_libelle, u.firstname, u.lastname, u.role
      FROM termes t
      LEFT JOIN categories c ON t.categorie_id = c.id
      LEFT JOIN users u ON t.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND t.terme LIKE ?`;
      const searchPattern = `${search}%`; // Start with pattern
      params.push(searchPattern);
    }

    if (category) {
      if (isNaN(category)) {
        sql += ` AND c.libelle = ?`;
        params.push(category);
      } else {
        sql += ` AND t.categorie_id = ?`;
        params.push(parseInt(category, 10));
      }
    }

    sql += ` ORDER BY t.terme ASC`;
    
    // Only add LIMIT if explicitly provided
    if (limit && !isNaN(limit)) {
      sql += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    let terms = [];
    try {
      terms = await db.query(sql.replace(/termes/g, 'termes'), params);
    } catch (errTer) {
      try {
        const sqlEn = sql
          .replace(/termes/g, 'terms')
          .replace(/categorie_id/g, 'category_id')
          .replace(/categorie_libelle/g, 'category_label')
          .replace(/t\.terme/g, 't.term');
        terms = await db.query(sqlEn, params);
      } catch (errEn) {
        throw errEn;
      }
    }

    res.json({
      status: 'success',
      data: terms,
      total: Array.isArray(terms) ? terms.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des termes',
      error: error.message,
    });
  }
});

// GET /api/terms/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const terms = await db.query(
      `
      SELECT t.*, c.libelle as categorie_libelle, u.firstname, u.lastname, u.role
      FROM termes t
      LEFT JOIN categories c ON t.categorie_id = c.id
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `,
      [id]
    );

    if (terms.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Terme non trouvé',
      });
    }

    res.json({
      status: 'success',
      data: terms[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du terme',
      error: error.message,
    });
  }
});

// POST /api/terms
router.post('/', async (req, res) => {
  try {
    // Accept both legacy and new payload shapes
    const terme = req.body.terme || req.body.term;
    const definition = req.body.definition || req.body.desc || '';
    const categorie_id = req.body.categorie_id || req.body.category_id || null;
    const examplesIn = req.body.exemples ?? req.body.exemple ?? [];
    const sourcesIn = req.body.sources ?? req.body.source ?? [];
    const remarquesIn = req.body.remarques ?? req.body.remarque ?? [];
    const author_id = req.body.author_id || req.body.authorId || null;
    const status = req.body.status || 'published';

    if (!terme || !definition) {
      return res.status(400).json({
        status: 'error',
        message: 'Le terme et la définition sont requis',
      });
    }

    // Normalize arrays/strings
    const finalExemple = Array.isArray(examplesIn)
      ? examplesIn.map(e => (typeof e === 'string' ? e : e?.text || '')).filter(Boolean).join('\n')
      : (examplesIn || null);

    const finalSource = Array.isArray(sourcesIn)
      ? sourcesIn.map(s => (typeof s === 'string' ? s : s?.text || '')).filter(Boolean).join('\n')
      : (sourcesIn || null);

    const finalRemarque = Array.isArray(remarquesIn)
      ? remarquesIn.map(r => (typeof r === 'string' ? r : r?.text || '')).filter(Boolean).join('\n')
      : (remarquesIn || null);

    const result = await db.query(
      `
      INSERT INTO termes (terme, definition, categorie_id, exemple, remarque, source, author_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        terme,
        definition,
        categorie_id || 1,
        finalExemple || null,
        finalRemarque || null,
        finalSource || null,
        author_id || 1,
      ]
    );

    // Try to set status if the column exists
    if (status) {
      try { await db.query('UPDATE termes SET status = ? WHERE id = ?', [status, result.insertId]); } catch (e) { /* ignore if column doesn't exist */ }
    }

    res.status(201).json({
      status: 'success',
      message: 'Terme créé avec succès',
      data: {
        id: result.insertId,
        terme,
        definition,
        categorie_id: categorie_id || 1,
  exemple: finalExemple || null,
  remarque: finalRemarque || null,
  source: finalSource || null,
        author_id: author_id || 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création du terme',
      error: error.message,
    });
  }
});

// PUT /api/terms/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const termRecord = await findTermRecord(id);

    if (!termRecord) {
      return res.status(404).json({ status: 'error', message: 'Terme non trouvé' });
    }

    const { table, row: existingRow } = termRecord;
    
    // Check permissions: Admin can edit all terms, Author can only edit their own terms
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    const isAuthor = userRole === 'auteur' || userRole === 'author';
    const isOwner = String(existingRow.author_id || existingRow.authorId) === String(userId);
    
    if (!isAdmin && !(isAuthor && isOwner)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Vous n\'avez pas la permission de modifier ce terme. Seul l\'auteur du terme ou un administrateur peut le modifier directement.' 
      });
    }

    const payload = req.body || {};

    const termValue = pickValue(payload, ['terme', 'term']);
    const definitionValue = pickValue(payload, ['definition']);
    const categoryIdValue = coerceNumeric(pickValue(payload, ['categorie_id', 'category_id']));
    const categoryLabelValue = pickValue(payload, ['category', 'categorie', 'categorie_libelle', 'category_label']);
    const examplesRaw = pickValue(payload, ['exemples', 'exemple', 'examples']);
    const sourcesRaw = pickValue(payload, ['sources', 'source']);
    const remarquesRaw = pickValue(payload, ['remarques', 'notes']);
    const remarqueRaw = remarquesRaw === undefined ? pickValue(payload, ['remarque', 'remark', 'note']) : undefined;
    const statusValue = pickValue(payload, ['status']);
    const authorValue = coerceNumeric(pickValue(payload, ['author_id', 'authorId']));

    const examplesText = normalizeTextList(examplesRaw);
    const remarkText = normalizeTextList(remarquesRaw !== undefined ? remarquesRaw : remarqueRaw);
    const sourcesText = normalizeTextList(sourcesRaw);

    const updates = [];
    const params = [];

    const pushForColumns = (columns, value) => {
      if (value === undefined) return false;
      for (const column of columns) {
        if (hasOwn(existingRow, column)) {
          updates.push(`${column} = ?`);
          params.push(value);
          return true;
        }
      }
      return false;
    };

  pushForColumns(['terme', 'term'], termValue);
  pushForColumns(['definition'], definitionValue);
  pushForColumns(['categorie_id', 'category_id'], categoryIdValue);
  pushForColumns(['category', 'categorie', 'categorie_libelle', 'category_label'], categoryLabelValue);
  pushForColumns(['exemple', 'examples'], examplesText);
  pushForColumns(['remarque', 'remark', 'notes'], remarkText);
  pushForColumns(['source', 'sources'], sourcesText);
  pushForColumns(['author_id', 'authorId'], authorValue);
  const appliedStatus = pushForColumns(['status'], statusValue);

    const timestampColumn = hasOwn(existingRow, 'updated_at')
      ? 'updated_at'
      : hasOwn(existingRow, 'updatedAt')
      ? 'updatedAt'
      : null;

    if (statusValue !== undefined && !appliedStatus) {
      return res.status(400).json({
        status: 'error',
        message: "Impossible de mettre à jour le statut pour ce terme (colonne 'status' absente).",
      });
    }

    if (!updates.length && !timestampColumn) {
      return res.status(400).json({ status: 'error', message: 'Aucun champ valide à mettre à jour' });
    }

    if (timestampColumn) {
      updates.push(`${timestampColumn} = NOW()`);
    }

    const updateSql = `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(updateSql, [...params, id]);

    const refreshedRows = await db.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
    const updated = Array.isArray(refreshedRows) && refreshedRows.length > 0 ? refreshedRows[0] : existingRow;

    res.json({ status: 'success', message: 'Terme mis à jour', data: updated });
  } catch (error) {
    console.error('Erreur update terme:', error.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la mise à jour du terme', error: error.message });
  }
});

// DELETE /api/terms/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const termRecord = await findTermRecord(id);

    if (!termRecord) {
      return res.status(404).json({ status: 'error', message: 'Terme non trouvé' });
    }

    const result = await db.query(`DELETE FROM ${termRecord.table} WHERE id = ?`, [id]);
    res.json({
      status: 'success',
      message: 'Terme supprimé',
      affected: result?.affectedRows ?? result?.affected_rows ?? 0,
    });
  } catch (error) {
    console.error('Erreur suppression terme:', error.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression du terme', error: error.message });
  }
});

export default router;
