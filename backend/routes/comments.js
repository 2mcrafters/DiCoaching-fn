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

// Best-effort creation of minimal tables/columns (does not throw)
async function ensureCommentsTables() {
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
  try {
    await q(`
      CREATE TABLE IF NOT EXISTS commentaires (
        id INT AUTO_INCREMENT PRIMARY KEY,
        term_id INT NOT NULL,
        author_id INT NOT NULL,
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
    await ensureCommentsTables();

    const hasEN = await tableExists("comments");
    const hasFR = await tableExists("commentaires");

    let rows = [];

    if (hasEN && hasFR) {
      try {
        rows = await q(
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
           UNION ALL
           SELECT 
             c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId,
             CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
             c.created_at AS createdAt,
             u.id AS u_id,
             CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
             CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
             u.sex, u.role, u.profile_picture
           FROM commentaires c
           LEFT JOIN users u ON u.id = c.author_id
           WHERE c.term_id = ?
           ORDER BY createdAt ASC`,
          [termId, termId]
        );
      } catch {
        rows = await q(
          `SELECT 
             c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
             CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
             c.created_at AS createdAt,
             NULL AS u_id, NULL AS firstname, NULL AS lastname, NULL AS sex, NULL AS role, NULL AS profile_picture
           FROM comments c
           WHERE c.term_id = ?
           UNION ALL
           SELECT 
             c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId,
             CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
             c.created_at AS createdAt,
             NULL AS u_id, NULL AS firstname, NULL AS lastname, NULL AS sex, NULL AS role, NULL AS profile_picture
           FROM commentaires c
           WHERE c.term_id = ?
           ORDER BY createdAt ASC`,
          [termId, termId]
        );
      }
    } else if (hasEN) {
      rows = await q(
        `SELECT 
           c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
           c.content, c.created_at AS createdAt,
           u.id AS u_id, u.firstname, u.lastname, u.sex, u.role, u.profile_picture
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.term_id = ?
         ORDER BY c.created_at ASC`,
        [termId]
      );
    } else if (hasFR) {
      rows = await q(
        `SELECT 
           c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId,
           c.content, c.created_at AS createdAt,
           u.id AS u_id, u.firstname, u.lastname, u.sex, u.role, u.profile_picture
         FROM commentaires c
         LEFT JOIN users u ON u.id = c.author_id
         WHERE c.term_id = ?
         ORDER BY c.created_at ASC`,
        [termId]
      );
    }

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

    await ensureCommentsTables();

    let insert;
    // Try EN table
    try {
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
    } catch {
      // Fallback FR table
      if (parentId !== undefined && parentId !== null) {
        insert = await q(
          "INSERT INTO commentaires (term_id, author_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, NOW())",
          [termId, userId, text, parentId]
        );
      } else {
        insert = await q(
          "INSERT INTO commentaires (term_id, author_id, content, created_at) VALUES (?, ?, ?, NOW())",
          [termId, userId, text]
        );
      }
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
       UNION ALL
       SELECT 
         c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId, 
         CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
         c.created_at AS createdAt,
         u.id AS u_id,
         CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
         CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
         u.sex, u.role, u.profile_picture
       FROM commentaires c
       LEFT JOIN users u ON u.id = c.author_id
       WHERE c.id = ?
       LIMIT 1`,
      [id, id]
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

    await ensureCommentsTables();

    // Load comment (EN then FR)
    let row = (await q("SELECT * FROM comments WHERE id = ?", [id]))[0];
    if (!row)
      row = (await q("SELECT * FROM commentaires WHERE id = ?", [id]))[0];

    if (!row) {
      return res
        .status(404)
        .json({ status: "error", message: "Commentaire non trouvé" });
    }

    const ownerId = row.author_id ?? row.user_id;
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

    // Delete children then the comment (both tables, best-effort)
    await q("DELETE FROM comments WHERE parent_id = ?", [id]).catch(() => {});
    await q("DELETE FROM commentaires WHERE parent_id = ?", [id]).catch(
      () => {}
    );
    await q("DELETE FROM comments WHERE id = ?", [id]).catch(async () => {
      await q("DELETE FROM commentaires WHERE id = ?", [id]);
    });

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
        !["admin", "researcher", "chercheur"].includes(requesterRole)
      ) {
        return res
          .status(403)
          .json({ status: "error", message: "Non autorisé" });
      }

      await ensureCommentsTables();

      let rows = [];
      try {
        // Only query tables that exist: comments + commentaires with termes
        rows = await q(
          `SELECT 
             c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
             CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
             c.created_at AS createdAt,
             CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
             CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
             NULL AS termSlug,
             CAST(t.terme AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitle
           FROM comments c
           LEFT JOIN users u ON u.id = c.user_id
           LEFT JOIN termes t ON t.id = c.term_id
           WHERE t.author_id = ?
           UNION ALL
           SELECT 
             c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId,
             CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
             c.created_at AS createdAt,
             CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
             CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
             NULL AS termSlug,
             CAST(t.terme AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitle
           FROM commentaires c
           LEFT JOIN users u ON u.id = c.author_id
           LEFT JOIN termes t ON t.id = c.term_id
           WHERE t.author_id = ?
         ORDER BY createdAt DESC`,
          [authorId, authorId]
        );
      } catch (e) {
        console.error("[comments] author query error:", e.message);
        // Fallback without user joins
        try {
          rows = await q(
            `SELECT 
               c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
               CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
               c.created_at AS createdAt,
               NULL AS firstname, NULL AS lastname,
               NULL AS termSlug,
               CAST(t.terme AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitle
             FROM comments c
             LEFT JOIN termes t ON t.id = c.term_id
             WHERE t.author_id = ?
             UNION ALL
             SELECT 
               c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId,
               CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
               c.created_at AS createdAt,
               NULL AS firstname, NULL AS lastname,
               NULL AS termSlug,
               CAST(t.terme AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS termTitle
             FROM commentaires c
             LEFT JOIN termes t ON t.id = c.term_id
             WHERE t.author_id = ?
           ORDER BY createdAt DESC`,
            [authorId, authorId]
          );
        } catch (e2) {
          console.error("[comments] fallback query error:", e2.message);
          rows = [];
        }
      }

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

export default router;
