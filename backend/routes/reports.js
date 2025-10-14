import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const selectReportsEnglish = `
  SELECT r.*, t.term as term_title, t.slug as term_slug,
         u.firstname, u.lastname,
         CONCAT(COALESCE(u.firstname,''), ' ', COALESCE(u.lastname,'')) AS reporter_name,
         u.email as reporter_email, u.phone as reporter_phone
  FROM reports r
  LEFT JOIN terms t ON r.term_id = t.id
  LEFT JOIN users u ON r.reporter_id = u.id
`;

const selectReportsFrench = `
  SELECT r.*, t.terme as term_title, NULL as term_slug,
         u.firstname, u.lastname,
         CONCAT(COALESCE(u.firstname,''), ' ', COALESCE(u.lastname,'')) AS reporter_name,
         u.email as reporter_email, u.phone as reporter_phone
  FROM reports r
  LEFT JOIN termes t ON r.term_id = t.id
  LEFT JOIN users u ON r.reporter_id = u.id
`;

const queryReports = async ({
  whereClause = "",
  params = [],
  orderClause = "ORDER BY r.created_at DESC",
} = {}) => {
  const suffix = `${whereClause ? ` ${whereClause}` : ""}${
    orderClause ? ` ${orderClause}` : ""
  }`;
  try {
    return await db.query(`${selectReportsEnglish} ${suffix}`, params);
  } catch (errEn) {
    return await db.query(`${selectReportsFrench} ${suffix}`, params);
  }
};

// GET /api/reports - Récupérer tous les signalements
router.get("/", authenticateToken, async (req, res) => {
  try {
    const reports = await queryReports();

    res.json({
      status: "success",
      data: reports,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des signalements:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des signalements",
      error: error.message,
    });
  }
});

// GET /api/reports/author/:authorId - all reports made against an author's terms
router.get("/author/:authorId", authenticateToken, async (req, res) => {
  try {
    const { authorId } = req.params;
    const requesterId = req.user && req.user.id;
    const requesterRole = req.user && req.user.role;

    // Only the author themselves or admin/researcher can view these reports
    if (
      String(requesterId) !== String(authorId) &&
      !["admin", "researcher", "chercheur"].includes(requesterRole)
    ) {
      return res.status(403).json({ status: "error", message: "Non autorisé" });
    }

    // Try English schema first, then French
    let rows = [];
    try {
      rows = await db.query(
        `${selectReportsEnglish} WHERE t.author_id = ? ORDER BY r.created_at DESC`,
        [authorId]
      );
    } catch (errEn) {
      rows = await db.query(
        `${selectReportsFrench} WHERE t.author_id = ? ORDER BY r.created_at DESC`,
        [authorId]
      );
    }

    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des signalements auteur:",
      error
    );
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors de la récupération des signalements",
        error: error.message,
      });
  }
});

// POST /api/reports - Créer un nouveau signalement
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { term_id, reason, details } = req.body;
    const reporter_id = req.user.id;

    if (!term_id || !reason) {
      return res.status(400).json({
        status: "error",
        message: "L'ID du terme et la raison sont requis",
      });
    }

    const result = await db.query(
      `
      INSERT INTO reports (term_id, reporter_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `,
      [term_id, reporter_id, reason, details || null]
    );

    const newReport = await queryReports({
      whereClause: "WHERE r.id = ?",
      params: [result.insertId],
      orderClause: "",
    });

    res.status(201).json({
      status: "success",
      message: "Signalement créé avec succès",
      data: newReport[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création du signalement:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la création du signalement",
      error: error.message,
    });
  }
});

// GET /api/reports/:id - Récupérer un signalement spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const report = await queryReports({
      whereClause: "WHERE r.id = ?",
      params: [id],
      orderClause: "",
    });

    if (!report || report.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Signalement non trouvé" });
    }

    // Authorization: allow if admin/researcher/chercheur OR reporter OR term author
    const requesterId = req.user && req.user.id;
    const requesterRole = ((req.user && req.user.role) || "").toLowerCase();
    const privileged = ["admin", "researcher", "chercheur"].includes(
      requesterRole
    );

    // Need term author id: attempt to load via joins already included (term_id present). We may not have author_id in select; fetch separately
    let termAuthorId = null;
    try {
      // Try English then French
      const rowsEn = await db.query(
        "SELECT t.author_id FROM terms t WHERE t.id = ?",
        [report[0].term_id]
      );
      if (rowsEn && rowsEn.length) {
        termAuthorId = rowsEn[0].author_id;
      } else {
        const rowsFr = await db.query(
          "SELECT t.author_id FROM termes t WHERE t.id = ?",
          [report[0].term_id]
        );
        if (rowsFr && rowsFr.length) termAuthorId = rowsFr[0].author_id;
      }
    } catch (e) {
      // Ignore; author id may remain null
    }

    const isReporter = String(report[0].reporter_id) === String(requesterId);
    const isTermAuthor =
      termAuthorId && String(termAuthorId) === String(requesterId);

    if (!privileged && !isReporter && !isTermAuthor) {
      return res.status(403).json({ status: "error", message: "Non autorisé" });
    }

    res.json({ status: "success", data: report[0] });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du signalement:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors de la récupération du signalement",
        error: error.message,
      });
  }
});

// PUT /api/reports/:id - Mettre à jour un signalement
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    const allowedStatuses = [
      "pending",
      "reviewed",
      "resolved",
      "ignored",
      "accepted",
    ];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message:
          "Statut invalide (autorisé: " + allowedStatuses.join(", ") + ")",
      });
    }

    // Load report with term author to validate permissions
    let reportRow = null;
    try {
      // Try English schema first
      const rowsEn = await db.query(
        `SELECT r.*, t.author_id FROM reports r LEFT JOIN terms t ON r.term_id = t.id WHERE r.id = ?`,
        [id]
      );
      if (rowsEn && rowsEn.length) {
        reportRow = rowsEn[0];
      }
      // If not found or author_id is null (terms table absent) attempt French schema
      if (!reportRow || typeof reportRow.author_id === "undefined") {
        try {
          const rowsFr = await db.query(
            `SELECT r.*, t.author_id FROM reports r LEFT JOIN termes t ON r.term_id = t.id WHERE r.id = ?`,
            [id]
          );
          if (rowsFr && rowsFr.length) {
            reportRow = rowsFr[0];
          }
        } catch (frErr) {
          // swallow; we'll handle missing reportRow below
          console.warn("[reports] French lookup failed:", frErr.message);
        }
      }
    } catch (lookupErr) {
      // English query failed (likely terms table missing); attempt French directly
      console.warn(
        "[reports] English lookup failed, trying French:",
        lookupErr.message
      );
      try {
        const rowsFr = await db.query(
          `SELECT r.*, t.author_id FROM reports r LEFT JOIN termes t ON r.term_id = t.id WHERE r.id = ?`,
          [id]
        );
        if (rowsFr && rowsFr.length) {
          reportRow = rowsFr[0];
        }
      } catch (frErr) {
        console.warn("[reports] French lookup also failed:", frErr.message);
      }
    }

    if (!reportRow) {
      return res
        .status(404)
        .json({ status: "error", message: "Signalement non trouvé" });
    }

    const requesterId = req.user.id;
    const requesterRole = (req.user.role || "").toLowerCase();
    const termAuthorId = reportRow.author_id;
    const privileged = ["admin", "researcher", "chercheur"].includes(
      requesterRole
    );
    const isTermAuthor = String(termAuthorId) === String(requesterId);

    if (!privileged && !isTermAuthor) {
      return res
        .status(403)
        .json({
          status: "error",
          message: "Non autorisé à modifier ce signalement",
        });
    }

    await db.query(
      `
      UPDATE reports
      SET status = ?, admin_comment = ?, reviewed_at = NOW(), reviewer_id = ?
      WHERE id = ?
    `,
      [status, admin_comment || null, requesterId, id]
    );

    const updatedReport = await queryReports({
      whereClause: "WHERE r.id = ?",
      params: [id],
      orderClause: "",
    });

    if (updatedReport.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Signalement non trouvé",
      });
    }

    res.json({
      status: "success",
      message: "Signalement mis à jour avec succès",
      data: updatedReport[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du signalement:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la mise à jour du signalement",
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
