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
    const {
      search,
      category,
      limit,
      author,
      authorId,
      authorName,
      status,
      from,
      to,
      sort,
    } = req.query;

    // Build base query for FR table
    let sql = `
      SELECT t.*, c.libelle as categorie_libelle, u.firstname, u.lastname, u.role
      FROM termes t
      LEFT JOIN categories c ON t.categorie_id = c.id
      LEFT JOIN users u ON t.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Text search (prefix on terme)
    if (search) {
      sql += ` AND t.terme LIKE ?`;
      params.push(`${search}%`);
    }

    // Category filter: id or label
    if (category) {
      if (!isNaN(category)) {
        sql += ` AND t.categorie_id = ?`;
        params.push(parseInt(category, 10));
      } else {
        sql += ` AND c.libelle = ?`;
        params.push(category);
      }
    }

    // Author filter: by id or name
    const authorParam = author ?? authorId ?? undefined;
    const authorNameParam = authorName ?? undefined;
    if (authorParam && !isNaN(authorParam)) {
      sql += ` AND t.author_id = ?`;
      params.push(parseInt(authorParam, 10));
    } else if (authorParam && isNaN(authorParam)) {
      // treat as name
      sql += ` AND (CONCAT(COALESCE(u.firstname,''),' ',COALESCE(u.lastname,'')) LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?)`;
      const pat = `%${String(authorParam)}%`;
      params.push(pat, pat, pat);
    } else if (authorNameParam) {
      const pat = `%${String(authorNameParam)}%`;
      sql += ` AND (CONCAT(COALESCE(u.firstname,''),' ',COALESCE(u.lastname,'')) LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?)`;
      params.push(pat, pat, pat);
    }

    // Status filter
    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    // Date range (best-effort on created_at)
    let usedDateFilters = false;
    let wantRecentSort = sort === "recent";
    if (from) {
      sql += ` AND t.created_at >= ?`;
      params.push(new Date(from));
      usedDateFilters = true;
    }
    if (to) {
      sql += ` AND t.created_at <= ?`;
      params.push(new Date(to));
      usedDateFilters = true;
    }

    // Sorting
    if (wantRecentSort) {
      sql += ` ORDER BY t.created_at DESC`;
    } else {
      sql += ` ORDER BY t.terme ASC`;
    }

    // Optional LIMIT
    if (limit && !isNaN(limit)) {
      sql += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    // Try FR query; on Unknown column for created_at, retry without date filters and with safe ORDER BY
    const runFr = async () => {
      try {
        return await db.query(sql, params);
      } catch (err) {
        const msg = (err && err.message) || "";
        if (
          msg.includes("Unknown column 't.created_at'") ||
          msg.includes("created_at")
        ) {
          // Rebuild without date filters and use id DESC for recent sort
          let sqlNoDate = sql
            .replace(/ AND t\.created_at >= \?/g, "")
            .replace(/ AND t\.created_at <= \?/g, "");
          if (wantRecentSort) {
            sqlNoDate = sqlNoDate.replace(
              /ORDER BY t\.created_at DESC/,
              "ORDER BY t.id DESC"
            );
          }
          const paramsNoDate = params.filter((_, idx) => true); // same count, but removed date params not trivial; rebuild instead
          // Rebuild params safely
          const rebuiltParams = [];
          // Reconstruct by re-parsing req.query to avoid misalignment
          // Simpler: recompose from scratch matching sqlNoDate order
          rebuiltParams.push(...[]);
          // Instead of reconstructing, run a fresh FR build without the date filters
          let frSql = `\n      SELECT t.*, c.libelle as categorie_libelle, u.firstname, u.lastname, u.role\n      FROM termes t\n      LEFT JOIN categories c ON t.categorie_id = c.id\n      LEFT JOIN users u ON t.author_id = u.id\n      WHERE 1=1\n    `;
          const frParams = [];
          if (search) {
            frSql += " AND t.terme LIKE ?";
            frParams.push(`${search}%`);
          }
          if (category) {
            if (!isNaN(category)) {
              frSql += " AND t.categorie_id = ?";
              frParams.push(parseInt(category, 10));
            } else {
              frSql += " AND c.libelle = ?";
              frParams.push(category);
            }
          }
          if (authorParam && !isNaN(authorParam)) {
            frSql += " AND t.author_id = ?";
            frParams.push(parseInt(authorParam, 10));
          } else if (authorParam && isNaN(authorParam)) {
            const pat = `%${String(authorParam)}%`;
            frSql += ` AND (CONCAT(COALESCE(u.firstname,''),' ',COALESCE(u.lastname,'')) LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?)`;
            frParams.push(pat, pat, pat);
          } else if (authorNameParam) {
            const pat = `%${String(authorNameParam)}%`;
            frSql += ` AND (CONCAT(COALESCE(u.firstname,''),' ',COALESCE(u.lastname,'')) LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?)`;
            frParams.push(pat, pat, pat);
          }
          if (status) {
            frSql += " AND t.status = ?";
            frParams.push(status);
          }
          frSql += wantRecentSort
            ? " ORDER BY t.id DESC"
            : " ORDER BY t.terme ASC";
          if (limit && !isNaN(limit)) {
            frSql += " LIMIT ?";
            frParams.push(parseInt(limit, 10));
          }
          return await db.query(frSql, frParams);
        }
        throw err;
      }
    };

    let terms = [];
    try {
      terms = await runFr();
    } catch (errTer) {
      // Build EN query by replacing FR-specific columns
      const buildEn = (withDate) => {
        let base = `\n      SELECT t.*, c.category_label as categorie_libelle, u.firstname, u.lastname, u.role\n      FROM terms t\n      LEFT JOIN categories c ON t.category_id = c.id\n      LEFT JOIN users u ON t.author_id = u.id\n      WHERE 1=1\n    `;
        const p = [];
        if (search) {
          base += " AND t.term LIKE ?";
          p.push(`${search}%`);
        }
        if (category) {
          if (!isNaN(category)) {
            base += " AND t.category_id = ?";
            p.push(parseInt(category, 10));
          } else {
            base += " AND c.category_label = ?";
            p.push(category);
          }
        }
        if (authorParam && !isNaN(authorParam)) {
          base += " AND t.author_id = ?";
          p.push(parseInt(authorParam, 10));
        } else if (authorParam && isNaN(authorParam)) {
          const pat = `%${String(authorParam)}%`;
          base += ` AND (CONCAT(COALESCE(u.firstname,''),' ',COALESCE(u.lastname,'')) LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?)`;
          p.push(pat, pat, pat);
        } else if (authorNameParam) {
          const pat = `%${String(authorNameParam)}%`;
          base += ` AND (CONCAT(COALESCE(u.firstname,''),' ',COALESCE(u.lastname,'')) LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?)`;
          p.push(pat, pat, pat);
        }
        if (status) {
          base += " AND t.status = ?";
          p.push(status);
        }
        if (withDate && from) {
          base += " AND t.created_at >= ?";
          p.push(new Date(from));
        }
        if (withDate && to) {
          base += " AND t.created_at <= ?";
          p.push(new Date(to));
        }
        base += wantRecentSort
          ? " ORDER BY t.created_at DESC"
          : " ORDER BY t.term ASC";
        if (limit && !isNaN(limit)) {
          base += " LIMIT ?";
          p.push(parseInt(limit, 10));
        }
        return { base, p };
      };
      try {
        const { base, p } = buildEn(true);
        terms = await db.query(base, p);
      } catch (errEn) {
        // Retry EN without date if created_at missing
        const { base, p } = buildEn(false);
        const safeBase = wantRecentSort
          ? base.replace("ORDER BY t.created_at DESC", "ORDER BY t.id DESC")
          : base;
        terms = await db.query(safeBase, p);
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
router.post("/", authenticateToken, async (req, res) => {
  try {
    // Permissions: Admin or confirmed/active author only
    const userId = req.user?.id;
    const roleFromToken = (req.user?.role || "").toLowerCase();
    let isAdmin = roleFromToken === "admin";
    let isAuthor = roleFromToken === "author";
    let authorApproved = false;

    // Source of truth: read current role/status from DB to avoid relying on JWT fields
    if (userId) {
      try {
        const [u] = await db.query(
          "SELECT role, status FROM users WHERE id = ?",
          [userId]
        );
        if (u) {
          const r = String(u.role || roleFromToken || "").toLowerCase();
          const s = String(u.status || "").toLowerCase();
          isAdmin = r === "admin";
          isAuthor = r === "author" || r === "auteur";
          authorApproved = s === "active" || s === "confirmed";
        }
      } catch (_) {
        // Fallback to token-derived checks if DB lookup fails
        authorApproved = false;
      }
    }
    if (!isAdmin && !(isAuthor && authorApproved)) {
      return res.status(403).json({
        status: "error",
        message:
          "Votre candidature d'auteur est en attente. Attendez l'approbation d'un administrateur pour ajouter des termes.",
      });
    }
    // Accept both legacy and new payload shapes
    const terme = req.body.terme || req.body.term;
    const definition = req.body.definition || req.body.desc || "";
    const categorie_id = req.body.categorie_id || req.body.category_id || null;
    const examplesIn = req.body.exemples ?? req.body.exemple ?? [];
    const sourcesIn = req.body.sources ?? req.body.source ?? [];
    const remarquesIn = req.body.remarques ?? req.body.remarque ?? [];
    const author_id = req.body.author_id || req.body.authorId || userId || null;
    const termStatus = req.body.status || "published";

    if (!terme || !definition) {
      return res.status(400).json({
        status: "error",
        message: "Le terme et la définition sont requis",
      });
    }

    // Normalize arrays/strings
    const finalExemple = Array.isArray(examplesIn)
      ? examplesIn
          .map((e) => (typeof e === "string" ? e : e?.text || ""))
          .filter(Boolean)
          .join("\n")
      : examplesIn || null;

    const finalSource = Array.isArray(sourcesIn)
      ? sourcesIn
          .map((s) => (typeof s === "string" ? s : s?.text || ""))
          .filter(Boolean)
          .join("\n")
      : sourcesIn || null;

    const finalRemarque = Array.isArray(remarquesIn)
      ? remarquesIn
          .map((r) => (typeof r === "string" ? r : r?.text || ""))
          .filter(Boolean)
          .join("\n")
      : remarquesIn || null;

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
        author_id || userId || 1,
      ]
    );

    // Try to set status if the column exists
    if (termStatus) {
      try {
        await db.query("UPDATE termes SET status = ? WHERE id = ?", [
          termStatus,
          result.insertId,
        ]);
      } catch (e) {
        /* ignore if column doesn't exist */
      }
    }

    res.status(201).json({
      status: "success",
      message: "Terme créé avec succès",
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
      status: "error",
      message: "Erreur lors de la création du terme",
      error: error.message,
    });
  }
});

// PUT /api/terms/:id
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const termRecord = await findTermRecord(id);

    if (!termRecord) {
      return res
        .status(404)
        .json({ status: "error", message: "Terme non trouvé" });
    }

    const { table, row: existingRow } = termRecord;

    // Check permissions: Admin can edit all terms, Author can only edit their own terms
    const userId = req.user?.id;
    const userRole = (req.user?.role || "").toLowerCase();
    const userStatus = (req.user?.status || "").toLowerCase();
    const isAdmin = userRole === "admin";
    const isAuthor = userRole === "author";
    const authorApproved =
      userStatus === "active" || userStatus === "confirmed";
    const isOwner =
      String(existingRow.author_id || existingRow.authorId) === String(userId);

    if (!isAdmin && !(isAuthor && authorApproved && isOwner)) {
      return res.status(403).json({
        status: "error",
        message:
          "Accès refusé. Seuls les administrateurs et les auteurs approuvés peuvent modifier leurs propres termes.",
      });
    }

    const payload = req.body || {};

    const termValue = pickValue(payload, ["terme", "term"]);
    const definitionValue = pickValue(payload, ["definition"]);
    const categoryIdValue = coerceNumeric(
      pickValue(payload, ["categorie_id", "category_id"])
    );
    const categoryLabelValue = pickValue(payload, [
      "category",
      "categorie",
      "categorie_libelle",
      "category_label",
    ]);
    const examplesRaw = pickValue(payload, ["exemples", "exemple", "examples"]);
    const sourcesRaw = pickValue(payload, ["sources", "source"]);
    const remarquesRaw = pickValue(payload, ["remarques", "notes"]);
    const remarqueRaw =
      remarquesRaw === undefined
        ? pickValue(payload, ["remarque", "remark", "note"])
        : undefined;
    const statusValue = pickValue(payload, ["status"]);
    const authorValue = coerceNumeric(
      pickValue(payload, ["author_id", "authorId"])
    );

    const examplesText = normalizeTextList(examplesRaw);
    const remarkText = normalizeTextList(
      remarquesRaw !== undefined ? remarquesRaw : remarqueRaw
    );
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

    pushForColumns(["terme", "term"], termValue);
    pushForColumns(["definition"], definitionValue);
    pushForColumns(["categorie_id", "category_id"], categoryIdValue);
    pushForColumns(
      ["category", "categorie", "categorie_libelle", "category_label"],
      categoryLabelValue
    );
    pushForColumns(["exemple", "examples"], examplesText);
    pushForColumns(["remarque", "remark", "notes"], remarkText);
    pushForColumns(["source", "sources"], sourcesText);
    pushForColumns(["author_id", "authorId"], authorValue);
    const appliedStatus = pushForColumns(["status"], statusValue);

    const timestampColumn = hasOwn(existingRow, "updated_at")
      ? "updated_at"
      : hasOwn(existingRow, "updatedAt")
      ? "updatedAt"
      : null;

    if (statusValue !== undefined && !appliedStatus) {
      return res.status(400).json({
        status: "error",
        message:
          "Impossible de mettre à jour le statut pour ce terme (colonne 'status' absente).",
      });
    }

    if (!updates.length && !timestampColumn) {
      return res.status(400).json({
        status: "error",
        message: "Aucun champ valide à mettre à jour",
      });
    }

    if (timestampColumn) {
      updates.push(`${timestampColumn} = NOW()`);
    }

    const updateSql = `UPDATE ${table} SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(updateSql, [...params, id]);

    const refreshedRows = await db.query(
      `SELECT * FROM ${table} WHERE id = ? LIMIT 1`,
      [id]
    );
    const updated =
      Array.isArray(refreshedRows) && refreshedRows.length > 0
        ? refreshedRows[0]
        : existingRow;

    res.json({ status: "success", message: "Terme mis à jour", data: updated });
  } catch (error) {
    console.error("Erreur update terme:", error.message);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la mise à jour du terme",
      error: error.message,
    });
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
