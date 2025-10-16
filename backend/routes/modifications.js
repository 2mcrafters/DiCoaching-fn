import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';
import slugify from 'slugify';

const router = express.Router();

const selectEnglish = `
  SELECT m.*, t.term as term_title, t.slug as term_slug, t.author_id as term_author_id,
         u.firstname as proposer_firstname, u.lastname as proposer_lastname, u.email as proposer_email,
         r.firstname as reviewer_firstname, r.lastname as reviewer_lastname
  FROM proposed_modifications m
  LEFT JOIN terms t ON m.term_id = t.id
  LEFT JOIN users u ON m.proposer_id = u.id
  LEFT JOIN users r ON m.reviewer_id = r.id
`;

const selectFrench = `
  SELECT m.*, t.terme as term_title, NULL as term_slug, t.author_id as term_author_id,
         u.firstname as proposer_firstname, u.lastname as proposer_lastname, u.email as proposer_email,
         r.firstname as reviewer_firstname, r.lastname as reviewer_lastname
  FROM proposed_modifications m
  LEFT JOIN termes t ON m.term_id = t.id
  LEFT JOIN users u ON m.proposer_id = u.id
  LEFT JOIN users r ON m.reviewer_id = r.id
`;

const queryModifications = async ({
  whereClause = "",
  params = [],
  orderClause = "ORDER BY m.created_at DESC",
} = {}) => {
  const suffix = `${whereClause ? ` ${whereClause}` : ""}${
    orderClause ? ` ${orderClause}` : ""
  }`;

  // Prefer querying available tables and merging results to handle cases where both tables exist
  const tableExists = async (name) => {
    try {
      const rows = await db.query("SHOW TABLES LIKE ?", [name]);
      return Array.isArray(rows) && rows.length > 0;
    } catch (_) {
      return false;
    }
  };

  const hasTerms = await tableExists("terms");
  const hasTermes = await tableExists("termes");

  let results = [];
  if (hasTerms) {
    try {
      const enRows = await db.query(`${selectEnglish} ${suffix}`, params);
      results.push(...enRows);
    } catch (_) {
      // ignore EN failures and continue
    }
  }
  if (hasTermes) {
    try {
      const frRows = await db.query(`${selectFrench} ${suffix}`, params);
      results.push(...frRows);
    } catch (_) {
      // ignore FR failures
    }
  }

  // If neither table exists (unlikely), fall back to EN attempt to surface the error
  if (!hasTerms && !hasTermes) {
    return await db.query(`${selectEnglish} ${suffix}`, params);
  }

  return results;
};

const normalizeModificationRow = (row) => {
  if (!row) return row;
  let parsedChanges = row.changes;
  if (typeof parsedChanges === "string") {
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
router.get("/", authenticateToken, async (req, res) => {
  try {
    const modifications = await queryModifications();

    res.json({
      status: "success",
      data: modifications.map(normalizeModificationRow),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des modifications:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des modifications",
      error: error.message,
    });
  }
});

// GET /api/modifications/:id - Récupérer une modification proposée
// NOTE: Keep static routes (e.g., /pending-validation) ABOVE dynamic routes like /:id
// to prevent path collisions where Express treats 'pending-validation' as an :id.
// GET /api/modifications/pending-validation - Get modifications pending validation by author
router.get("/pending-validation", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = (req.user.role || "").toLowerCase();
    const scope = (req.query.scope || "").toString().toLowerCase();

    // Only authors and admins can validate modifications
    const isAuthor = role === "author";
    const isAdmin = role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Accès réservé aux auteurs et administrateurs",
      });
    }

    // Get pending modifications on user's terms (excluding their own proposals)
    // Treat NULL and common variants as pending
    const pendingWhere =
      "(m.status IS NULL OR LOWER(m.status) IN ('pending','en_attente','to_validate'))";

    // scope=mine forces filtering to the current user's authored terms even for admins
    const forceMine = scope === "mine";
    const shouldFilterToMine = isAuthor || forceMine;
    const whereClause =
      !isAdmin || shouldFilterToMine
        ? `WHERE ${pendingWhere} AND t.author_id = ? AND m.proposer_id != ?`
        : `WHERE ${pendingWhere}`;

    const params = !isAdmin || shouldFilterToMine ? [userId, userId] : [];

    const modifications = await queryModifications({
      whereClause,
      params,
      // Use id DESC to avoid relying on created_at in legacy tables
      orderClause: "ORDER BY m.id DESC",
    });

    res.json({
      status: "success",
      data: modifications.map(normalizeModificationRow),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des modifications en attente:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des modifications en attente",
      error: error.message,
    });
  }
});

// GET /api/modifications/:id - Récupérer une modification proposée
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await queryModifications({
      whereClause: "WHERE m.id = ?",
      params: [id],
      orderClause: "",
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Modification non trouvée",
      });
    }

    res.json({
      status: "success",
      data: normalizeModificationRow(rows[0]),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "�?O Erreur lors de la récupération de la modification:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération de la modification",
      error: error.message,
    });
  }
});

// POST /api/modifications - Créer une nouvelle modification proposée
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { term_id, changes, comment } = req.body;
    const proposer_id = req.user.id;

    if (!term_id || !changes) {
      return res.status(400).json({
        status: "error",
        message: "L'ID du terme et les modifications sont requis",
      });
    }

    const result = await db.query(
      `
      INSERT INTO proposed_modifications (term_id, proposer_id, changes, comment, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `,
      [term_id, proposer_id, JSON.stringify(changes), comment || null]
    );

    const newRows = await queryModifications({
      whereClause: "WHERE m.id = ?",
      params: [result.insertId],
      orderClause: "",
    });

    res.status(201).json({
      status: "success",
      message: "Modification proposée avec succès",
      data: normalizeModificationRow(newRows[0]),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la modification:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la création de la modification",
      error: error.message,
    });
  }
});

// PUT /api/modifications/:id - Mettre a jour une modification proposee
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment, comment, changes } = req.body;

    const existingRows = await db.query(
      "SELECT * FROM proposed_modifications WHERE id = ?",
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Modification non trouvee",
      });
    }

    const existing = existingRows[0];
    const role = (req.user.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isOwner = Number(existing.proposer_id) === Number(req.user.id);

    const wantsAdminUpdate = typeof status !== "undefined";
    const wantsOwnerUpdate =
      typeof comment !== "undefined" || typeof changes !== "undefined";

    if (!wantsAdminUpdate && !wantsOwnerUpdate) {
      return res.status(400).json({
        status: "error",
        message: "Aucun champ valide a mettre a jour",
      });
    }

    // Admins can always perform status updates; authors can validate only on their own terms
    if (wantsAdminUpdate) {
      if (isAdmin) {
        // allowed
      } else if (role === "author") {
        // Get term to check if user is the term author. Try EN `terms` then FR `termes`.
        let termAuthorId = null;
        try {
          const termRows = await db.query(
            "SELECT author_id FROM terms WHERE id = ?",
            [existing.term_id]
          );
          if (termRows && termRows.length > 0) {
            termAuthorId = Number(termRows[0].author_id);
          }
        } catch (_) {
          // ignore and fallback to FR table
        }
        if (termAuthorId === null) {
          try {
            const termRowsFr = await db.query(
              "SELECT author_id FROM termes WHERE id = ?",
              [existing.term_id]
            );
            if (termRowsFr && termRowsFr.length > 0) {
              termAuthorId = Number(termRowsFr[0].author_id);
            }
          } catch (_) {
            // ignore
          }
        }

        const isTermAuthor =
          termAuthorId !== null && termAuthorId === Number(req.user.id);

        // Author can validate modifications on their terms BUT NOT their own proposals
        if (isOwner) {
          return res.status(403).json({
            status: "error",
            message:
              "Vous ne pouvez pas valider votre propre proposition de modification",
          });
        }

        // Non-admin, non-term-author cannot validate
        if (role === "author" && !isTermAuthor) {
          return res.status(403).json({
            status: "error",
            message:
              "Vous ne pouvez valider que les modifications sur vos propres termes",
          });
        }

        // Pending authors cannot validate anything; require active/confirmed status
        if (role === "author") {
          let authorStatus = null;
          try {
            const rows = await db.query(
              "SELECT status FROM users WHERE id = ?",
              [req.user.id]
            );
            if (rows && rows.length > 0) {
              authorStatus = (rows[0].status || "").toLowerCase();
            }
          } catch (_) {}
          const approved =
            authorStatus === "active" || authorStatus === "confirmed";
          if (!approved) {
            return res.status(403).json({
              status: "error",
              message:
                "Votre compte auteur doit être approuvé avant de valider des modifications",
            });
          }
        }
      } else {
        return res.status(403).json({
          status: "error",
          message: "Action reservee aux administrateurs ou auteurs concernés",
        });
      }
    }

    if (wantsOwnerUpdate && !isOwner) {
      return res.status(403).json({
        status: "error",
        message: "Vous ne pouvez modifier que vos propres propositions",
      });
    }

    if (
      wantsOwnerUpdate &&
      existing.status &&
      existing.status.toLowerCase() !== "pending"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Cette proposition a deja ete traitee et ne peut plus etre modifiee",
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

      if (typeof comment !== "undefined") {
        const cleanedComment =
          typeof comment === "string" && comment.trim().length > 0
            ? comment.trim()
            : null;
        updateFields.push("comment = ?");
        params.push(cleanedComment);
      }

      if (typeof changes !== "undefined") {
        let normalizedChanges = {};

        if (changes && typeof changes === "object") {
          normalizedChanges = changes;
        } else if (typeof changes === "string") {
          const trimmed = changes.trim();
          if (trimmed.length > 0) {
            try {
              normalizedChanges = JSON.parse(trimmed);
            } catch (error) {
              return res.status(400).json({
                status: "error",
                message:
                  "Le format des modifications est invalide (JSON attendu)",
              });
            }
          }
        }

        updateFields.push("changes = ?");
        params.push(JSON.stringify(normalizedChanges || {}));
      }

      if (updateFields.length > 0) {
        params.push(id);
        await db.query(
          `UPDATE proposed_modifications SET ${updateFields.join(
            ", "
          )} WHERE id = ?`,
          params
        );
      }
    }

    const updatedModification = await queryModifications({
      whereClause: "WHERE m.id = ?",
      params: [id],
      orderClause: "",
    });

    if (!updatedModification || updatedModification.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Modification non trouvee",
      });
    }

    res.json({
      status: "success",
      message: "Modification mise a jour avec succes",
      data: normalizeModificationRow(updatedModification[0]),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise a jour de la modification:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la mise a jour de la modification",
      error: error.message,
    });
  }
});

// GET /api/modifications/pending-validation - Get modifications pending validation by author
// (duplicate route removed)

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
