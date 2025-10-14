import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from "./auth.js";

const router = express.Router();

// GET /api/modifications
router.get("/modifications", authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT * FROM modifications ORDER BY created_at DESC LIMIT 500"
    );
    res.json({ status: "success", data: rows });
  } catch (e) {
    console.error("[modifications] list error:", e.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des modifications",
      });
  }
});

// POST /api/modifications
router.post("/modifications", authenticateToken, async (req, res) => {
  try {
    const { termId, changes = {}, comment = "" } = req.body || {};
    if (!termId)
      return res
        .status(400)
        .json({ status: "error", message: "termId requis" });
    const result = await db.query(
      `INSERT INTO modifications (term_id, proposer_id, changes, comment, status, created_at)
			 VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [termId, req.user.id, JSON.stringify(changes), comment]
    );
    res.status(201).json({ status: "success", data: { id: result.insertId } });
  } catch (e) {
    console.error("[modifications] create error:", e.message);
    res
      .status(500)
      .json({ status: "error", message: "Erreur lors de la création" });
  }
});

export default router;
