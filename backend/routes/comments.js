// comments.js
import express from "express";
import db from "../services/database.js";
import { authenticateToken } from "./auth.js";
import slugify from "slugify";

const router = express.Router();

/* ----------------------- Helpers ----------------------- */

// Simple query wrapper - database.js already returns just the rows
const q = async (sql, params = []) => {
  const res = await db.query(sql, params);
  return Array.isArray(res) ? res : [];
};

const mapUser = (u = {}) => ({
  id: u.id ?? null,
  firstname: u.firstname ?? null,
  lastname: u.lastname ?? null,
  sex: u.sex ?? null,
  role: u.role ?? null,
  profile_picture: u.profile_picture ?? null,
});

const buildTermLink = (slugOrId, commentId) =>
  slugOrId ? `/fiche/${String(slugOrId)}#comment-${commentId}` : null;

const tableExists = async (name) => {
  try {
    const rows = await q("SHOW TABLES LIKE ?", [name]);
    return rows.length > 0;
  } catch {
    return false;
  }
};

// Best-effort creation of minimal table (does not throw)
async function ensureCommentsTable() {
  try {
    await q(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        term_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch {}
}

/* ----------------------- Routes ----------------------- */

/**
 * GET /api/terms/:termId/comments
 * Return comments (EN+FR tables merged), oldest first.
 */
router.get("/terms/:termId/comments", async (req, res) => {
  try {
    const { termId } = req.params;
    await ensureCommentsTable();

    const rows = await q(
      `SELECT 
         c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
         CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
         c.created_at AS createdAt,
         u.id AS u_id, 
         CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
         CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
         u.sex, u.role, u.profile_picture
       FROM comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.term_id = ?
       ORDER BY c.created_at ASC`,
      [termId]
    );

    const data = rows.map((r) => ({
      id: r.id,
      termId: r.termId,
      authorId: r.authorId,
      content: r.content,
      parentId: r.parentId ?? null,
      createdAt: r.createdAt,
      author: mapUser({
        id: r.u_id,
        firstname: r.firstname,
        lastname: r.lastname,
        sex: r.sex,
        role: r.role,
        profile_picture: r.profile_picture,
      }),
      authorName: [r.firstname, r.lastname].filter(Boolean).join(" ").trim(),
    }));

    res.json({ status: "success", data });
  } catch (err) {
    console.error("[comments] list error:", err);
    res.status(500).json({
      status: "error",
      message: "Erreur lors du chargement des commentaires",
    });
  }
});

/**
 * POST /api/terms/:termId/comments
 * Create a comment (tries EN table first, then FR).
 */
router.post("/terms/:termId/comments", authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user?.id;
    const { content, parentId } = req.body || {};
    const text = typeof content === "string" ? content.trim() : "";

    if (!text) {
      return res
        .status(400)
        .json({ status: "error", message: "Contenu requis" });
    }

    await ensureCommentsTable();

    let insert;
    if (parentId !== undefined && parentId !== null) {
      insert = await q(
        "INSERT INTO comments (term_id, user_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, NOW())",
        [termId, userId, text, parentId]
      );
    } else {
      insert = await q(
        "INSERT INTO comments (term_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())",
        [termId, userId, text]
      );
    }

    const id = insert.insertId;

    // Reload (works for either table)
    const rows = await q(
      `SELECT 
         c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId, 
         CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
         c.created_at AS createdAt,
         u.id AS u_id,
         CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
         CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
         u.sex, u.role, u.profile_picture
       FROM comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = ?
       LIMIT 1`,
      [id]
    );

    const r = rows[0] || {
      id,
      termId: Number(termId),
      authorId: userId,
      content: text,
      parentId: parentId ?? null,
      createdAt: new Date().toISOString(),
      u_id: userId,
      firstname: null,
      lastname: null,
      sex: null,
      role: null,
      profile_picture: null,
    };

    const data = {
      id: r.id,
      termId: r.termId,
      authorId: r.authorId,
      content: r.content,
      parentId: r.parentId ?? null,
      createdAt: r.createdAt,
      author: mapUser({
        id: r.u_id,
        firstname: r.firstname,
        lastname: r.lastname,
        sex: r.sex,
        role: r.role,
        profile_picture: r.profile_picture,
      }),
      authorName: [r.firstname, r.lastname].filter(Boolean).join(" ").trim(),
    };

    res.status(201).json({ status: "success", data });
  } catch (err) {
    console.error("[comments] create error:", err);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'ajout du commentaire",
    });
  }
});

/**
 * DELETE /api/comments/:id
 * Owner, admin, or term author can delete. Deletes children first.
 */
router.delete("/comments/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const requesterRole = String(req.user?.role || "").toLowerCase();

  await ensureCommentsTable();

    // Load comment
    let row = (await q("SELECT * FROM comments WHERE id = ?", [id]))[0];

    if (!row) {
      return res
        .status(404)
        .json({ status: "error", message: "Commentaire non trouvé" });
    }

  const ownerId = row.user_id;
    const isOwner = String(ownerId) === String(requesterId);
    const isAdmin = requesterRole === "admin";

    // Also allow term author
    let isTermAuthor = false;
    try {
      const t1 = await q("SELECT author_id FROM terms WHERE id = ?", [
        row.term_id,
      ]);
      if (t1.length)
        isTermAuthor = String(t1[0].author_id) === String(requesterId);
    } catch {}
    if (!isTermAuthor) {
      const t2 = await q("SELECT author_id FROM termes WHERE id = ?", [
        row.term_id,
      ]);
      if (t2.length)
        isTermAuthor = String(t2[0].author_id) === String(requesterId);
    }

    if (!isOwner && !isAdmin && !isTermAuthor) {
      return res.status(403).json({ status: "error", message: "Non autorisé" });
    }

    // Delete children then the comment
    await q("DELETE FROM comments WHERE parent_id = ?", [id]).catch(() => {});
    await q("DELETE FROM comments WHERE id = ?", [id]).catch(() => {});

    res.json({ status: "success" });
  } catch (err) {
    console.error("[comments] delete error:", err);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la suppression du commentaire",
    });
  }
});

/**
 * GET /api/comments/author/:authorId
 * Comments on terms authored by :authorId (EN+FR merged), newest first.
 */
router.get(
  "/comments/author/:authorId",
  authenticateToken,
  async (req, res) => {
    try {
      const { authorId } = req.params;
      const requesterId = req.user?.id;
      const requesterRole = String(req.user?.role || "").toLowerCase();

      if (
        String(authorId) !== String(requesterId) &&
        !["admin", "researcher"].includes(requesterRole)
      ) {
        return res
          .status(403)
          .json({ status: "error", message: "Non autorisé" });
      }

      await ensureCommentsTable();
      const hasTerms = await tableExists("terms");
      const hasTermes = await tableExists("termes");

      let joinClause = "";
      let selectTitle = "NULL AS termSlug, NULL AS termTitle";
      if (hasTermes) {
        joinClause = "LEFT JOIN termes t ON t.id = c.term_id";
        selectTitle =
          "NULL AS termSlug, CAST(t.terme AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitle";
      } else if (hasTerms) {
        joinClause = "LEFT JOIN terms t ON t.id = c.term_id";
        selectTitle =
          "t.slug AS termSlug, CAST(t.term AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitle";
      }

      const rows = await q(
        `SELECT 
           c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
           CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
           c.created_at AS createdAt,
           CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
           CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
           ${selectTitle}
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         ${joinClause}
         ${joinClause ? "WHERE t.author_id = ?" : ""}
         ORDER BY createdAt DESC`,
        joinClause ? [authorId] : []
      );

      const data = rows.map((r) => {
        const title = r.termTitle || "";
        const slug =
          r.termSlug ||
          (title
            ? slugify(String(title), { lower: true, strict: true })
            : null);

        return {
          id: r.id,
          termId: r.termId,
          content: r.content,
          createdAt: r.createdAt,
          authorId: r.authorId,
          authorName:
            [r.firstname, r.lastname].filter(Boolean).join(" ").trim() ||
            "Utilisateur",
          term: {
            id: r.termId,
            title,
            slug,
            link: buildTermLink(slug || r.termId, r.id),
          },
        };
      });

      res.json({ status: "success", data });
    } catch (err) {
      console.error("[comments] author list error:", err);
      res.status(500).json({
        status: "error",
        message: "Erreur lors du chargement des commentaires auteur",
      });
    }
  }
);

/**
 * GET /api/comments/me
 * Returns comments authored by the current user across EN/FR tables, newest first.
 */
router.get("/comments/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    await ensureCommentsTable();
    const hasTerms = await tableExists("terms");
    const hasTermes = await tableExists("termes");

    const selectCols = [
      "c.id",
      "c.term_id AS termId",
      "c.created_at AS createdAt",
      "CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content",
    ];
    const joins = [];
    if (hasTerms) {
      selectCols.push(
        "te.slug AS termSlugEN",
        "CAST(te.term AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitleEN"
      );
      joins.push("LEFT JOIN terms te ON te.id = c.term_id");
    } else {
      selectCols.push("NULL AS termSlugEN", "NULL AS termTitleEN");
    }
    if (hasTermes) {
      selectCols.push(
        "CAST(tf.terme AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitleFR"
      );
      joins.push("LEFT JOIN termes tf ON tf.id = c.term_id");
    } else {
      selectCols.push("NULL AS termTitleFR");
    }

    const sql = `SELECT ${selectCols.join(",\n           ")}
       FROM comments c
       ${joins.join("\n         ")}
       WHERE c.user_id = ?`;
    const rows = await q(sql, [userId]);

    const data = rows.map((r) => {
      const title = r.termTitleEN || r.termTitleFR || "";
      const slug =
        r.termSlugEN ||
        (title ? slugify(String(title), { lower: true, strict: true }) : null);
      return {
        id: r.id,
        termId: r.termId,
        content: r.content,
        createdAt: r.createdAt,
        term: {
          id: r.termId,
          title,
          slug,
          link: buildTermLink(slug || r.termId, r.id),
        },
      };
    });

    res.json({ status: "success", data });
  } catch (err) {
    console.error("[comments] me list error:", err);
    res.status(500).json({
      status: "error",
      message: "Erreur lors du chargement de vos commentaires",
    });
  }
});

export default router;
