import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';
import slugify from "slugify";

const router = express.Router();

// GET /api/terms/:termId/likes -> { count, likedByUser }
router.get("/terms/:termId/likes", async (req, res) => {
  try {
    const { termId } = req.params;
    const [{ cnt }] = await db.query(
      "SELECT COUNT(*) AS cnt FROM likes WHERE term_id = ?",
      [termId]
    );

    res.json({ status: "success", data: { count: Number(cnt) || 0 } });
  } catch (err) {
    console.error("Error fetching likes:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des likes",
        error: err.message,
      });
  }
});

// GET /api/terms/:termId/likes/me -> { count, likedByUser }
router.get("/terms/:termId/likes/me", authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user && req.user.id;
    const [{ cnt }] = await db.query(
      "SELECT COUNT(*) AS cnt FROM likes WHERE term_id = ?",
      [termId]
    );
    const existing = await db.query(
      "SELECT id FROM likes WHERE user_id = ? AND term_id = ?",
      [userId, termId]
    );
    res.json({
      status: "success",
      data: { count: Number(cnt) || 0, likedByUser: existing.length > 0 },
    });
  } catch (err) {
    console.error("Error fetching like status:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement du statut de like",
        error: err.message,
      });
  }
});

// POST /api/terms/:termId/likes/toggle
router.post(
  "/terms/:termId/likes/toggle",
  authenticateToken,
  async (req, res) => {
    try {
      const { termId } = req.params;
      const userId = req.user && req.user.id;

      // Check if already liked
      const existing = await db.query(
        "SELECT id FROM likes WHERE user_id = ? AND term_id = ?",
        [userId, termId]
      );

      let liked;
      if (existing.length > 0) {
        await db.query("DELETE FROM likes WHERE user_id = ? AND term_id = ?", [
          userId,
          termId,
        ]);
        liked = false;
      } else {
        await db.query(
          "INSERT INTO likes (user_id, term_id, created_at) VALUES (?, ?, NOW())",
          [userId, termId]
        );
        liked = true;
      }

      const [{ cnt }] = await db.query(
        "SELECT COUNT(*) AS cnt FROM likes WHERE term_id = ?",
        [termId]
      );
      res.json({ status: "success", data: { liked, count: Number(cnt) || 0 } });
    } catch (err) {
      console.error("Error toggling like:", err.message);
      res
        .status(500)
        .json({
          status: "error",
          message: "Erreur lors de l'action d'aimer",
          error: err.message,
        });
    }
  }
);

// GET /api/user/likes/stats -> Get total likes for user's terms
router.get("/user/likes/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;

    // Count total likes on all terms authored by this user
    const result = await db.query(
      `SELECT COUNT(*) AS totalLikes 
       FROM likes l 
       INNER JOIN termes t ON l.term_id = t.id 
       WHERE t.author_id = ?`,
      [userId]
    );

    const totalLikes = result[0]?.totalLikes || 0;
    res.json({ status: "success", data: { totalLikes: Number(totalLikes) } });
  } catch (err) {
    console.error("Error fetching user like stats:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des statistiques de likes",
        error: err.message,
      });
  }
});

// GET /api/user/liked-terms -> Get list of terms the user has liked
router.get("/user/liked-terms", authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;

    // Get all terms liked by this user with term details
    const likedTerms = await db.query(
      `SELECT 
        t.id,
        t.terme,
        t.definition,
        t.status,
        l.created_at as liked_at
       FROM likes l
       INNER JOIN termes t ON l.term_id = t.id
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json({
      status: "success",
      data: likedTerms.map((term) => ({
        id: term.id,
        term: term.terme,
        definition: term.definition,
        status: term.status,
        likedAt: term.liked_at,
      })),
    });
  } catch (err) {
    console.error("Error fetching liked terms:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des termes aimés",
        error: err.message,
      });
  }
});

// GET /api/user/received-likes -> Get all likes received on user's terms with user details
router.get("/user/received-likes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;

    // Helper: check table existence safely
    const tableExists = async (name) => {
      try {
        const rows = await db.query("SHOW TABLES LIKE ?", [name]);
        return Array.isArray(rows) && rows.length > 0;
      } catch (_) {
        return false;
      }
    };

    const hasTermes = await tableExists("termes");
    const hasTerms = await tableExists("terms");

    // 1) Collect IDs of terms authored by this user from available tables
    let authoredIds = [];
    if (hasTermes) {
      const rows = await db.query("SELECT id FROM termes WHERE author_id = ?", [
        userId,
      ]);
      authoredIds.push(...rows.map((r) => Number(r.id)));
    }
    if (hasTerms) {
      const rows = await db.query("SELECT id FROM terms WHERE author_id = ?", [
        userId,
      ]);
      authoredIds.push(...rows.map((r) => Number(r.id)));
    }

    // Deduplicate
    authoredIds = Array.from(new Set(authoredIds)).filter((v) =>
      Number.isFinite(v)
    );

    if (authoredIds.length === 0) {
      return res.json({ status: "success", data: [] });
    }

    // 2) Fetch likes on these term IDs (no hard join on term tables)
    const placeholders = authoredIds.map(() => "?").join(",");
    const likesRows = await db.query(
      `SELECT id AS like_id, user_id, term_id, created_at AS liked_at
       FROM likes
       WHERE term_id IN (${placeholders})
       ORDER BY created_at DESC`,
      authoredIds
    );

    if (!likesRows || likesRows.length === 0) {
      return res.json({ status: "success", data: [] });
    }

    // 3) Hydrate users
    const likerIds = Array.from(
      new Set(
        likesRows
          .map((r) => Number(r.user_id))
          .filter((v) => Number.isFinite(v))
      )
    );
    let usersMap = new Map();
    if (likerIds.length > 0) {
      const uPlaceholders = likerIds.map(() => "?").join(",");
      const users = await db.query(
        `SELECT id, name, firstname, lastname, email, profile_picture, role FROM users WHERE id IN (${uPlaceholders})`,
        likerIds
      );
      users.forEach((u) => usersMap.set(Number(u.id), u));
    }

    // 4) Hydrate terms (from available tables)
    let termsMap = new Map();
    const termIds = Array.from(
      new Set(
        likesRows
          .map((r) => Number(r.term_id))
          .filter((v) => Number.isFinite(v))
      )
    );
    if (termIds.length > 0 && hasTermes) {
      const tPlaceholders = termIds.map(() => "?").join(",");
      const tRows = await db.query(
        // Some legacy 'termes' tables do not have a 'slug' column. Do not select it; compute later if needed.
        `SELECT id, terme AS name, status FROM termes WHERE id IN (${tPlaceholders})`,
        termIds
      );
      tRows.forEach((t) => termsMap.set(Number(t.id), t));
    }
    if (termIds.length > 0 && hasTerms) {
      const tPlaceholders2 = termIds.map(() => "?").join(",");
      const tRows2 = await db.query(
        `SELECT id, term AS name, slug, status FROM terms WHERE id IN (${tPlaceholders2})`,
        termIds
      );
      tRows2.forEach((t) => {
        if (!termsMap.has(Number(t.id))) termsMap.set(Number(t.id), t);
      });
    }

    // 5) Build response
    const data = likesRows.map((like) => {
      const user = usersMap.get(Number(like.user_id)) || {};
      const term = termsMap.get(Number(like.term_id)) || { id: like.term_id };
      const displayName =
        user.name ||
        `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
        user.email ||
        "Utilisateur";
      return {
        id: like.like_id,
        likedAt: like.liked_at,
        user: {
          id: like.user_id,
          name: displayName,
          email: user.email || null,
          profilePicture: user.profile_picture || null,
          role: user.role || null,
        },
        term: {
          id: like.term_id,
          name: term.name || null,
          slug:
            term.slug ||
            (term.name
              ? slugify(String(term.name), { lower: true, strict: true })
              : null),
          status: term.status || null,
        },
      };
    });

    res.json({ status: "success", data });
  } catch (err) {
    console.error("Error fetching received likes:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur lors du chargement des likes reçus",
        error: err.message,
      });
  }
});

export default router;
