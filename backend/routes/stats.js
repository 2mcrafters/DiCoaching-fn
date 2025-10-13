import express from "express";
import db from "../services/database.js";

const router = express.Router();

const rowsOrDefault = (rows, fallback = []) =>
  Array.isArray(rows) && rows.length ? rows : fallback;

const firstOr = (rows, key, fallback = 0) =>
  rows && rows[0] && rows[0][key] != null ? Number(rows[0][key]) : fallback;

// Execute a COUNT query and gracefully fall back to 0 when the table is missing
const safeCount = async (query, params, key) => {
  try {
    const rows = await db.query(query, params);
    return firstOr(rows, key);
  } catch (error) {
    console.warn(`[stats] Unable to run count query for key "${key}": ${error.message}`);
    return 0;
  }
};

// Execute a GROUP BY query and gracefully return an empty array on failure
const safeGroupQuery = async (query, params = []) => {
  try {
    const rows = await db.query(query, params);
    return rowsOrDefault(rows, []);
  } catch (error) {
    console.warn(`[stats] Unable to run grouped stats query: ${error.message}`);
    return [];
  }
};

router.get("/", async (req, res) => {
  try {
    const totalUsers = await safeCount(
      "SELECT COUNT(*) as totalUsers FROM users",
      [],
      "totalUsers"
    );

    let totalTerms = await safeCount(
      "SELECT COUNT(*) as totalTerms FROM termes",
      [],
      "totalTerms"
    );
    if (!totalTerms) {
      totalTerms = await safeCount(
        "SELECT COUNT(*) as totalTerms FROM terms",
        [],
        "totalTerms"
      );
    }

    const totalCategories = await safeCount(
      "SELECT COUNT(*) as totalCategories FROM categories",
      [],
      "totalCategories"
    );

    const pendingUsers = await safeCount(
      `
      SELECT COUNT(*) as pendingUsers
      FROM users
      WHERE role IN ('auteur', 'author') AND status = 'pending'
    `,
      [],
      "pendingUsers"
    );

    const usersByRoleRows = await safeGroupQuery(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);

    let termsByStatusRows = await safeGroupQuery(`
        SELECT status, COUNT(*) as count
        FROM termes
        GROUP BY status
      `);
    if (!termsByStatusRows.length) {
      termsByStatusRows = await safeGroupQuery(`
        SELECT status, COUNT(*) as count
        FROM terms
        GROUP BY status
      `);
    }

    const recentUsers = await safeCount(
      `
      SELECT COUNT(*) as recentUsers
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `,
      [],
      "recentUsers"
    );

    let recentTerms = await safeCount(
      `
        SELECT COUNT(*) as recentTerms
        FROM termes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `,
      [],
      "recentTerms"
    );
    if (!recentTerms) {
      recentTerms = await safeCount(
        `
        SELECT COUNT(*) as recentTerms
        FROM terms
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `,
        [],
        "recentTerms"
      );
    }

    let modificationCountRows = [];
    try {
      modificationCountRows = await db.query(`
        SELECT
          COUNT(*) as totalModifications,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingModifications
        FROM proposed_modifications
      `);
    } catch (error) {
      console.warn(`[stats] Unable to count proposed modifications: ${error.message}`);
      modificationCountRows = [{ totalModifications: 0, pendingModifications: 0 }];
    }
    const modificationCounts = modificationCountRows[0] || {
      totalModifications: 0,
      pendingModifications: 0,
    };

    let reportCountRows = [];
    try {
      reportCountRows = await db.query(`
        SELECT
          COUNT(*) as totalReports,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingReports
        FROM reports
      `);
    } catch (error) {
      console.warn(`[stats] Unable to count reports: ${error.message}`);
      reportCountRows = [{ totalReports: 0, pendingReports: 0 }];
    }
    const reportCounts = reportCountRows[0] || {
      totalReports: 0,
      pendingReports: 0,
    };

    const stats = {
      totalUsers,
      totalTerms,
      totalCategories,
      pendingUsers,
      totalModifications: Number(modificationCounts.totalModifications) || 0,
      pendingModifications: Number(modificationCounts.pendingModifications) || 0,
      totalReports: Number(reportCounts.totalReports) || 0,
      pendingReports: Number(reportCounts.pendingReports) || 0,
      usersByRole: usersByRoleRows.reduce((acc, row) => {
        if (row?.role) acc[row.role] = Number(row.count) || 0;
        return acc;
      }, {}),
      termsByStatus: termsByStatusRows.reduce((acc, row) => {
        if (row?.status) acc[row.status] = Number(row.count) || 0;
        return acc;
      }, {}),
      recentUsers,
      recentTerms,
    };

    console.log("[stats] computed:", stats);

    res.json({
      status: "success",
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("Error while retrieving statistics:", error.message);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
});

export default router;
