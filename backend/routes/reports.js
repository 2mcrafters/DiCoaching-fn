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

// GET /api/reports
router.get("/reports", authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT * FROM reports ORDER BY created_at DESC LIMIT 500"
    );
    res.json({ status: "success", data: rows });
  } catch (e) {
    console.error("[reports] list error:", e.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des signalements",
      });
  }
});

// POST /api/reports
router.post("/reports", authenticateToken, async (req, res) => {
  try {
    const { term_id, reason, details = null } = req.body || {};
    if (!term_id || !reason)
      return res
        .status(400)
        .json({ status: "error", message: "Données manquantes" });
    const result = await db.query(
      `INSERT INTO reports (term_id, reporter_id, reason, details, status, created_at)
			 VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [term_id, req.user.id, reason, details]
    );

    // Notify term author
    try {
      let [term] = await db.query(
        "SELECT id, terme, slug, author_id FROM termes WHERE id = ? LIMIT 1",
        [term_id]
      );
      if (
        term &&
        term.author_id &&
        String(term.author_id) !== String(req.user.id)
      ) {
        const slug = term.slug || slugify(term.terme || "");
        await createNotification({
          userId: term.author_id,
          type: "report",
          title: "Votre terme a été signalé",
          message: reason,
          link: `/fiche/${slug}`,
          refs: { termId: Number(term_id) },
          meta: {
            actor: {
              id: req.user.id,
              firstname: req.user.firstname,
              lastname: req.user.lastname,
            },
          },
        });
      }
    } catch (nErr) {
      console.warn("[reports] notification warning:", nErr?.message);
    }

    res.status(201).json({ status: "success", data: { id: result.insertId } });
  } catch (e) {
    console.error("[reports] create error:", e.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors de l'envoi du signalement",
      });
  }
});

// PUT /api/reports/:id
router.put("/reports/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status)
      return res
        .status(400)
        .json({ status: "error", message: "Statut requis" });
    await db.query("UPDATE reports SET status = ? WHERE id = ?", [status, id]);
    res.json({ status: "success" });
  } catch (e) {
    console.error("[reports] update error:", e.message);
    res
      .status(500)
      .json({ status: "error", message: "Erreur lors de la mise à jour" });
  }
});

// DELETE /api/reports/:id
router.delete("/reports/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM reports WHERE id = ?", [id]);
    res.json({ status: "success" });
  } catch (e) {
    console.error("[reports] delete error:", e.message);
    res
      .status(500)
      .json({ status: "error", message: "Erreur lors de la suppression" });
  }
});

export default router;
