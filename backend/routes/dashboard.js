import express from 'express';
import db from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/dashboard/stats - Get comprehensive dashboard statistics for current user
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const userRole = req.user && req.user.role;

    const stats = {
      user: {
        id: userId,
        role: userRole,
      },
      terms: {},
      activities: {},
      likes: {},
      comments: {},
      decisions: {},
      global: {},
    };

    // ========================================
    // USER'S TERMS STATISTICS
    // ========================================
    
    // Total terms created by user
    const [termsCount] = await db.query(
      'SELECT COUNT(*) as count FROM termes WHERE author_id = ?',
      [userId]
    );
    stats.terms.total = Number(termsCount.count || 0);

    // Terms by status
    const termsStatus = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM termes 
       WHERE author_id = ? 
       GROUP BY status`,
      [userId]
    );
    
    stats.terms.byStatus = {
      published: 0,
      draft: 0,
      pending: 0,
      rejected: 0,
    };
    
    termsStatus.forEach(row => {
      stats.terms.byStatus[row.status] = Number(row.count || 0);
    });

    // Calculate percentage of published terms
    stats.terms.publishedPercentage = stats.terms.total > 0
      ? Math.round((stats.terms.byStatus.published / stats.terms.total) * 100)
      : 0;

    // ========================================
    // LIKES STATISTICS
    // ========================================
    
    // Total likes received on user's terms
    const [likesReceived] = await db.query(
      `SELECT COUNT(*) as count 
       FROM likes l 
       INNER JOIN termes t ON l.term_id = t.id 
       WHERE t.author_id = ?`,
      [userId]
    );
    stats.likes.received = Number(likesReceived.count || 0);

    // Total likes given by user
    const [likesGiven] = await db.query(
      'SELECT COUNT(*) as count FROM likes WHERE user_id = ?',
      [userId]
    );
    stats.likes.given = Number(likesGiven.count || 0);

    // Most liked term by this user
    const [mostLikedTerm] = await db.query(
      `SELECT t.id, t.terme, COUNT(l.id) as likeCount 
       FROM termes t 
       LEFT JOIN likes l ON l.term_id = t.id 
       WHERE t.author_id = ? 
       GROUP BY t.id, t.terme 
       ORDER BY likeCount DESC 
       LIMIT 1`,
      [userId]
    );
    
    stats.likes.mostLikedTerm = mostLikedTerm ? {
      id: mostLikedTerm.id,
      name: mostLikedTerm.terme,
      count: Number(mostLikedTerm.likeCount || 0),
    } : null;

    // ========================================
    // COMMENTS STATISTICS
    // ========================================
    
    // Comments made by user
    const [commentsMade] = await db.query(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [userId]
    );
    stats.comments.made = Number(commentsMade.count || 0);

    // Comments received on user's terms
    const [commentsReceived] = await db.query(
      `SELECT COUNT(*) as count 
       FROM comments c 
       INNER JOIN termes t ON c.term_id = t.id 
       WHERE t.author_id = ? AND c.user_id != ?`,
      [userId, userId]
    );
    stats.comments.received = Number(commentsReceived.count || 0);

    // ========================================
    // REPORTS STATISTICS
    // ========================================
    
    // Reports received on user's terms (status = resolved)
    // Note: reports table may reference 'terms' but we use 'termes' table name
    const [reportsReceived] = await db.query(
      `SELECT COUNT(DISTINCT r.id) as count 
       FROM reports r 
       WHERE r.term_id IN (
         SELECT id FROM termes WHERE author_id = ?
       ) AND r.status = 'resolved'`,
      [userId]
    );
    
    // Reports created by user (for researchers/chercheurs)
    const [reportsCreated] = await db.query(
      `SELECT COUNT(*) as count 
       FROM reports 
       WHERE reporter_id = ?`,
      [userId]
    );
    
    stats.reports = {
      received: Number(reportsReceived.count || 0),
      created: Number(reportsCreated.count || 0),
    };

    // ========================================
    // DECISIONS STATISTICS (for admins/researchers)
    // ========================================
    
    if (['admin', 'researcher'].includes(userRole)) {
      try {
        // Decisions made by user
        const [decisionsMade] = await db.query(
          "SELECT COUNT(*) as count FROM decisions WHERE user_id = ?",
          [userId]
        );
        stats.decisions.made = Number(decisionsMade.count || 0);

        // Decisions by type
        const decisionsByType = await db.query(
          `SELECT decision_type, COUNT(*) as count 
           FROM decisions 
           WHERE user_id = ? 
           GROUP BY decision_type`,
          [userId]
        );

        stats.decisions.byType = {
          approved: 0,
          rejected: 0,
          pending: 0,
          revision_requested: 0,
        };

        decisionsByType.forEach((row) => {
          if (
            row?.decision_type &&
            stats.decisions.byType[row.decision_type] != null
          ) {
            stats.decisions.byType[row.decision_type] = Number(row.count || 0);
          }
        });

        // Decisions received on user's terms
        const [decisionsReceived] = await db.query(
          `SELECT COUNT(*) as count 
           FROM decisions d 
           INNER JOIN termes t ON d.term_id = t.id 
           WHERE t.author_id = ?`,
          [userId]
        );
        stats.decisions.received = Number(decisionsReceived.count || 0);
      } catch (decErr) {
        // Graceful fallback if decisions table was removed
        console.warn(
          "[dashboard] Decisions statistics skipped:",
          decErr.message
        );
        stats.decisions = {
          made: 0,
          byType: {
            approved: 0,
            rejected: 0,
            pending: 0,
            revision_requested: 0,
          },
          received: 0,
          disabled: true,
          reason: "decisions table missing",
        };
      }
    }

    // ========================================
    // ACTIVITY TIMELINE
    // ========================================
    
    // Recent activities would require created_at column in termes table
    // Since termes table doesn't have created_at, we'll skip timeline stats
    stats.activities.recentTerms = [];

    // Total activity count (terms + comments + likes)
    stats.activities.total = 
      stats.terms.total + 
      stats.comments.made + 
      stats.likes.given;

    // ========================================
    // GLOBAL STATISTICS (for context)
    // ========================================
    
    if (userRole === 'admin') {
      // Total users
      const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
      stats.global.totalUsers = Number(totalUsers.count || 0);

      // Total terms in system
      const [totalTerms] = await db.query('SELECT COUNT(*) as count FROM termes');
      stats.global.totalTerms = Number(totalTerms.count || 0);

      // Total categories
      const [totalCategories] = await db.query('SELECT COUNT(*) as count FROM categories');
      stats.global.totalCategories = Number(totalCategories.count || 0);

      // Pending terms for review
      const [pendingTerms] = await db.query(
        "SELECT COUNT(*) as count FROM termes WHERE status = 'pending'"
      );
      stats.global.pendingTerms = Number(pendingTerms.count || 0);

      // Total likes in system
      const [totalLikes] = await db.query('SELECT COUNT(*) as count FROM likes');
      stats.global.totalLikes = Number(totalLikes.count || 0);

      // Total comments in system
      const [totalComments] = await db.query('SELECT COUNT(*) as count FROM comments');
      stats.global.totalComments = Number(totalComments.count || 0);
    }

    // ========================================
    // RANKING/POSITION (for authors)
    // ========================================
    
    if (['author', 'researcher'].includes(userRole)) {
      // User's rank by published terms
      const rankings = await db.query(
        `SELECT author_id, COUNT(*) as termCount 
         FROM termes 
         WHERE status = 'published' 
         GROUP BY author_id 
         ORDER BY termCount DESC`
      );
      
      const userRankIndex = rankings.findIndex(r => r.author_id === userId);
      stats.ranking = {
        position: userRankIndex >= 0 ? userRankIndex + 1 : null,
        totalAuthors: rankings.length,
        percentile: rankings.length > 0 
          ? Math.round(((rankings.length - userRankIndex) / rankings.length) * 100)
          : 0,
      };
    }

    // ========================================
    // CONTRIBUTION SCORE
    // ========================================
    
    // Calculate contribution score
    // Formula: (published terms * 10) + (likes received * 2) + (comments made * 1)
    stats.contributionScore = 
      (stats.terms.byStatus.published * 10) + 
      (stats.likes.received * 2) + 
      (stats.comments.made * 1);

    res.json({ 
      status: 'success', 
      data: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors du chargement des statistiques',
      error: err.message 
    });
  }
});

// GET /api/dashboard/chart-data - Get data for dashboard charts
router.get('/dashboard/chart-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { period = '30' } = req.query; // days

    // Terms created over time - disabled since termes table doesn't have created_at
    const termsOverTime = [];

    // Likes received over time (likes table has created_at)
    const likesOverTime = await db.query(
      `SELECT DATE(l.created_at) as date, COUNT(*) as count 
       FROM likes l 
       INNER JOIN termes t ON l.term_id = t.id 
       WHERE t.author_id = ? AND l.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(l.created_at)
       ORDER BY date ASC`,
      [userId, parseInt(period)]
    );

    // Comments received over time (comments table has created_at)
    const commentsOverTime = await db.query(
      `SELECT DATE(c.created_at) as date, COUNT(*) as count 
       FROM comments c 
       INNER JOIN termes t ON c.term_id = t.id 
       WHERE t.author_id = ? AND c.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(c.created_at)
       ORDER BY date ASC`,
      [userId, parseInt(period)]
    );

    res.json({
      status: 'success',
      data: {
        termsOverTime: [], // Disabled until created_at added to termes table
        likesOverTime: likesOverTime.map(row => ({
          date: row.date,
          count: Number(row.count || 0),
        })),
        commentsOverTime: commentsOverTime.map(row => ({
          date: row.date,
          count: Number(row.count || 0),
        })),
      },
    });

  } catch (err) {
    console.error('Error fetching chart data:', err.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors du chargement des données graphiques',
      error: err.message 
    });
  }
});

export default router;
