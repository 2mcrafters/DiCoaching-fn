import express from "express";
import db from "../services/database.js";
import { authenticateToken } from "./auth.js";
import { createNotification } from "../services/notifications.js";

const router = express.Router();

// Helper to slugify a string
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

// GET /api/terms/:termId/comments
router.get("/terms/:termId/comments", async (req, res) => {
  try {
    const { termId } = req.params;
    const rows = await db.query(
      `SELECT c.id, c.term_id as termId, c.user_id as userId, c.content, c.parent_id as parentId,
              c.created_at as createdAt, c.updated_at as updatedAt
       FROM comments c WHERE c.term_id = ? ORDER BY c.created_at ASC`,
      [termId]
    );
    res.json({ status: "success", data: rows });
  } catch (e) {
    console.error("[comments] list error:", e.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des commentaires",
      });
  }
});

// GET /api/comments/author/:authorId - comments on author's terms
router.get("/comments/author/:authorId", async (req, res) => {
  try {
    const { authorId } = req.params;
    const rows = await db.query(
      `SELECT c.id, c.term_id as termId, c.user_id as userId, c.content, c.parent_id as parentId,
              c.created_at as createdAt, t.terme as termTitle, t.slug as termSlug
       FROM comments c
       INNER JOIN termes t ON c.term_id = t.id
       WHERE t.author_id = ?
       ORDER BY c.created_at DESC
       LIMIT 200`,
      [authorId]
    );
    // add slug if missing
    const out = rows.map((r) => ({
      ...r,
      termSlug: r.termSlug || slugify(r.termTitle || ""),
    }));
    res.json({ status: "success", data: out });
  } catch (e) {
    console.error("[comments] author list error:", e.message);
    res
      .status(500)
      .json({ status: "error", message: "Erreur lors du chargement" });
  }
});

// POST /api/terms/:termId/comments
router.post("/terms/:termId/comments", authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const { content, parent_id = null } = req.body || {};
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Contenu requis" });
    }

    const result = await db.query(
      `INSERT INTO comments (term_id, user_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [termId, req.user.id, content.trim(), parent_id || null]
    );
    const newId = result.insertId;

    // Fetch term for notification context
    let [term] = await db.query(
      "SELECT id, terme, slug, author_id FROM termes WHERE id = ? LIMIT 1",
      [termId]
    );
    if (!term) {
      term = { id: termId, terme: "", slug: null, author_id: null };
    }
    const slug = term.slug || slugify(term.terme || "terme");

    // Notify term author (if commenter is not the author)
    if (term.author_id && String(term.author_id) !== String(req.user.id)) {
      await createNotification({
        userId: term.author_id,
        type: parent_id ? "reply" : "comment",
        title: parent_id
          ? "Nouvelle réponse à un commentaire"
          : "Nouveau commentaire sur votre terme",
        message: content.length > 140 ? content.slice(0, 140) + "…" : content,
        link: `/fiche/${slug}#comment-${newId}`,
        refs: { termId: Number(termId), commentId: newId },
        meta: {
          actor: {
            id: req.user.id,
            firstname: req.user.firstname,
            lastname: req.user.lastname,
          },
        },
      });
    }

    // If it's a reply, notify parent comment author (if different)
    if (parent_id) {
      try {
        const [parent] = await db.query(
          "SELECT user_id FROM comments WHERE id = ? LIMIT 1",
          [parent_id]
        );
        if (parent && String(parent.user_id) !== String(req.user.id)) {
          await createNotification({
            userId: parent.user_id,
            type: "reply",
            title: "Quelqu'un a répondu à votre commentaire",
            message:
              content.length > 140 ? content.slice(0, 140) + "…" : content,
            link: `/fiche/${slug}#comment-${newId}`,
            refs: { termId: Number(termId), commentId: newId },
            meta: {
              actor: {
                id: req.user.id,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
              },
            },
          });
        }
      } catch {}
    }

    res.status(201).json({ status: "success", data: { id: newId } });
  } catch (e) {
    console.error("[comments] create error:", e.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors de l'ajout du commentaire",
      });
  }
});

// DELETE /api/comments/:id
router.delete("/comments/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await db.query(
      "SELECT user_id FROM comments WHERE id = ? LIMIT 1",
      [id]
    );
    if (!row)
      return res
        .status(404)
        .json({ status: "error", message: "Commentaire introuvable" });
    const isOwner = String(row.user_id) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({
          status: "error",
          message: "Non autorisé à supprimer ce commentaire",
        });
    }
    await db.query("DELETE FROM comments WHERE id = ?", [id]);
    res.json({ status: "success" });
  } catch (e) {
    console.error("[comments] delete error:", e.message);
    res
      .status(500)
      .json({ status: "error", message: "Erreur lors de la suppression" });
  }
});

export default router;
